const { describeGraph, getInfo, listChannels, sendToRoute } = require('../lnd-actions')
const { Big, getChannelSymbol } = require('../utils')
/**
 * This is the default timelock delta for the final hop in the chain.
 * This is typically specified by the payment request
 * @see `min_final_cltv_expiry` in {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md#tagged-fields}
 * When it is not defined by the payee (as in this case, where we're not satisfying a payment request),
 * we use a default for the final hop.
 * @see {@link https://github.com/lightningnetwork/lnd/blob/26636ce9943c4f0300a1d006c1f7ae3ebf078519/routing/router.go#L33}
 * @type {Number}
 * @default 9
 * @constant
 */
const MIN_FINAL_CLTV_EXPIRY_DELTA = 9
/**
 * If a block is mined while the route is processing, one of the calculated CLTV Deltas may be too small
 * causing the payment to fail. We add an extra block buffer to every step to ensure it won't fail.
 * This is especially problematic on simnet where we mine blocks every 10 seconds, but it is a known issue on mainnet
 * @see {@link https://github.com/lightningnetwork/lnd/issues/535}
 * @type {Number}
 * @constant
 */
const CLTV_BUFFER = 1

/**
 * Executes a swap as the initiating node
 *
 * @param {String} counterpartyPubKey LN identity_publickey
 * @param {String} swapHash           swap hash that will be associated with the swap
 * @param {Object} inbound            Inbound currency details
 * @param {String} inbound.symbol     Symbol of the inbound currency
 * @param {String} inbound.value      Int64 string of the value of inbound currency
 * @param {Object} outbound           Outbound currency details
 * @param {String} outbound.symbol    Symbol of the outbound currency
 * @param {String} outbound.value     Int64 string of the value of outbound currency
 * @returns {Promise<void>}           Promise that resolves when the swap is settled
 */
async function executeSwap (counterpartyPubKey, swapHash, inbound, outbound) {
  this.logger.info(`Executing swap for ${swapHash} with ${counterpartyPubKey}`, { inbound, outbound })

  // get all routes
  const [ graph, { identityPubkey, blockHeight }, { channels } ] = await Promise.all([
    describeGraph({ client: this.client }),
    getInfo({ client: this.client }),
    listChannels({ client: this.client })
  ])

  this.logger.debug(`Retrieved channel graph with ${graph.edges.length} edges`, { graph })

  const hints = getBandwidthHints(channels, identityPubkey)

  this.logger.debug(`Got bandwidth hints for ${swapHash}`, { hints })

  // find paths
  const outboundPath = findPaths(graph.edges, hints, identityPubkey, counterpartyPubKey, outbound.symbol, outbound.amount)
  this.logger.debug(`Found an outbound path to ${counterpartyPubKey} for ${swapHash}`, { path: outboundPath })

  const inboundPath = findPaths(graph.edges, hints, counterpartyPubKey, identityPubkey, inbound.symbol, inbound.amount)
  this.logger.debug(`Found an inbound path from ${counterpartyPubKey} for ${swapHash}`, { path: inboundPath })

  if (!outboundPath || !inboundPath) {
    throw new Error(`Can't find a route between ${identityPubkey} and ${counterpartyPubKey} to swap ${outbound.amount} ${outbound.symbol} for ${inbound.amount} ${inbound.symbol}`)
  }

  const route = routeFromPath(inbound.amount, blockHeight, MIN_FINAL_CLTV_EXPIRY_DELTA, outboundPath.concat(inboundPath), outboundPath.length - 1, outbound.amount)
  this.logger.debug(`Constructed a route for ${swapHash}`, { route })

  const { paymentError, paymentPreimage } = await sendToRoute(swapHash, [ route ], { client: this.client })

  if (paymentError) {
    throw new Error(`Error from LND while sending to route: ${paymentError}`)
  }

  return paymentPreimage
}

/**
 * Construct a route (with fee and time lock data) from a selected path
 * @param {String} inboundAmount Int64 string of amount to send
 * @param {Number} blockHeight Current best block height to build CLTVs on
 * @param {Number} finalCLTVDelta Amount of the final CLTV delta
 * @param  {Array<InternalChannelEdge>} path Array of channel edges in order for the full path
 * @param {Number} counterpartyPosition Index of the channel just before the counteparty node
 * @param {String} counterpartyAmount [description]
 * @return {Object}      Route
 */
function routeFromPath (inboundAmount, blockHeight, finalCLTVDelta, path, counterpartyPosition, outboundAmount) {
  const inboundAmountMsat = Big(inboundAmount).times(1000)
  const outboundAmountMsat = Big(outboundAmount).times(1000)

  // we want to traverse the path in reverse so we can
  // build up to our final amount
  const backtrack = path.slice().reverse()
  // we want the index of the channel before we hit the counterparty
  const backtrackPosition = (backtrack.length - 1) - counterpartyPosition

  let currentAmountMsat = inboundAmountMsat
  let currentCLTV = blockHeight + finalCLTVDelta + CLTV_BUFFER
  let totalFeesMsat = Big(0)

  const hops = backtrack.map((channel, index) => {
    const hop = {
      chanId: channel.channelId,
      chanCapacity: channel.capacity,
      amtToForwardMsat: currentAmountMsat.toString(),
      expiry: currentCLTV
    }

    let feeMsat
    let timeLockDelta

    // first in back track is our final destination
    if (index === 0) {
      // last hop: no fees as there is nothing to transit
      feeMsat = '0'
      // no additional timelock for an outgoing link since there is no outgoing link
      timeLockDelta = 0
    } else {
      // this node's next channel is what determines the fee/timelock to transit the link
      const nextChannel = backtrack[index - 1]
      feeMsat = computeFee(currentAmountMsat, nextChannel.policy)
      timeLockDelta = nextChannel.policy.timeLockDelta + CLTV_BUFFER
    }

    // if we are at the counterparty we need to switch currency amounts, and there is no fee
    if (index === backtrackPosition) {
      hop.feeMsat = '0'
      currentAmountMsat = outboundAmountMsat
    } else {
      hop.feeMsat = feeMsat
      // update the current amount so we have enough funds to forward
      currentAmountMsat = currentAmountMsat.plus(feeMsat)
    }

    totalFeesMsat = totalFeesMsat.plus(hop.feeMsat)

    // update the current cltv to have enough expiry for the _outgoing_ link
    currentCLTV = currentCLTV + timeLockDelta

    return hop
  }).reverse()

  return {
    hops: hops,
    totalTimeLock: Number(currentCLTV), // timelock is a uint32, so needs to be a number
    totalAmtMsat: currentAmountMsat.toString(),
    totalFeesMsat: totalFeesMsat.toString()
  }
}

/**
 * Compute the fee to use a given channel
 * @param  {String} amount Int64 amount, in millisatoshis to be sent
 * @param  {LND~RoutingPolicy} policy       Routing policy for the channel
 * @param  {String} policy.feeBaseMsat      The fee in millisatoshis, that will be charged to use this link regardless of amount
 * @param  {String} policy.feeRateMilliMsat The fee in millisatoshis, that will be charged per million millisatoshis that transit this link (in addition to the base fee)
 * @return {String}                         Int64 amount, in millisatoshis, of the fee that should be paid
 */
function computeFee (amount, policy) {
  const baseFee = Big(policy.feeBaseMsat)
  const feeRate = Big(policy.feeRateMilliMsat)

  /**
   * we need to round up so that our fee will be accepted
   * @see {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/07-routing-gossip.md#htlc-fees}
   */
  const variableFee = feeRate.times(amount).div(1000000).round(0, 3)

  return baseFee.plus(variableFee).toString()
}

/**
 * @typedef {Object} BandwidthHint
 * @property {String} <PublicKeyA> The int64 string amount, in base units (e.g. Satoshis) that is available on <PublicKeyA>'s side fo the channel for sending to <PublicKeyB>
 * @property {String} <PublicKeyB> The int64 string amount, in base units (e.g. Satoshis) that is available on <PublicKeyA>'s side fo the channel for sending to <PublicKeyB>
 */

/**
 * Construct an object with specific bandwidth for channels that we are party to
 * Bandwidth hints are more precise measures of bandwidth available on a channel in each direction
 * @param  {Array<Channel>}                    channels       List of channels we are party to
 * @param  {String}                            identityPubkey Our Public Key
 * @return {Object.<ChannelId, BandwidthHint>} Key value of channel IDs and available balance by source public key
 */
function getBandwidthHints (channels, identityPubkey) {
  const activeChannels = channels.filter(c => c.active)

  return activeChannels.reduce((hints, channel) => {
    hints[channel.chanId] = {
      [identityPubkey]: channel.localBalance,
      [channel.remotePubkey]: channel.remoteBalance
    }
    return hints
  }, {})
}

/**
 * Find a path that can route from one pubkey to another with an `amount` of `symbol`
 * @param  {Array<LND~ChannelEdge} edges      Edges of the known network from LND~DescribeGraph
 * @param  {Object}                hints      Key value of channel bandwidth hints from `getBandwidthHints`
 * @param  {String}                fromPubKey Public key of the node we are routing from
 * @param  {String}                toPubKey   Public key of the node we are routing to
 * @param  {String}                symbol     Symbol of the currency we are routing (i.e. `BTC` or `LTC`)
 * @param  {String}                amount     Int64 string of the amount of base units (e.g. Satoshis) we are routing
 * @param  {Array<String>}         visited    Array of channel ids that we have previosly tried
 * @return {Array}                            A viable path
 */
function findPaths (edges, hints, fromPubKey, toPubKey, symbol, amount, visited = []) {
  const candidates = findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)

  const endOfPath = candidates.find((c) => c.toPubKey === toPubKey)

  // we found our target pubkey, so return
  if (endOfPath) return [ endOfPath ]

  // loop over the candidate channels to find the rest of the path
  const paths = candidates.map(candidate => {
    const localVisited = visited.slice()
    localVisited.push(candidate.channelId)

    // find the rest of the path
    const restOfPath = findPaths(edges, hints, candidate.toPubKey, toPubKey, symbol, amount, localVisited)

    if (restOfPath) {
      return [ candidate, ...restOfPath ]
    }

    return [ candidate ]
  }).filter(path => {
    const lastSegment = path[path.length - 1]
    return lastSegment.toPubKey === toPubKey
  })

  // if we have anything, return it
  // TODO: return multiple paths so that LND has some route choices
  return paths[0]
}

/**
 * Find all channels that:
 *  - are connected to a given node
 *  - are of the right symbol
 *  - have not already been visited
 *  - have sufficient bandwidth or capacity (as far as we can tell) to support the transaction
 * @param  {Array<LND~ChannelEdge} edges      Channel edges available in the graph
 * @param  {Object}                hints      Key value of channel bandwidth hints from `getBandwidthHints`
 * @param  {String}                fromPubKey Public key of the source node
 * @param  {String}                symbol     `BTC` or `LTC` -  symbol of the currency we're using
 * @param  {String}                amount     Int64 amount that the channel should carry
 * @param  {Array<String>}         visited    Array of channels that we have already traversed
 * @return {Array<InternalChannelEdge>}       Array of channel edges that work
 */
function findOutboundChannels (edges, hints, fromPubKey, symbol, amount, visited = []) {
  return edges.reduce((filtered, { node1Pub, node2Pub, capacity, node1Policy, node2Policy, channelId }) => {
    // don't retrace
    if (visited.includes(channelId)) {
      return filtered
    }

    // neither node is ours
    if (node1Pub !== fromPubKey && node2Pub !== fromPubKey) {
      return filtered
    }

    // not the right symbol
    if (getChannelSymbol(node1Policy, node2Policy) !== symbol) {
      return filtered
    }

    /**
     * If we have bandwidth hints for this channel we should use them, otherwise fall back to capacity
     * @see getBandwidthHints
     * @param  {Object} hints[channelId] Hints for balance on each side of this channel
     */
    if (hints[channelId]) {
      if (Big(hints[channelId][fromPubKey]).lt(amount)) {
        return filtered
      }
    } else if (Big(capacity).lt(amount)) {
      // not enough capacity
      return filtered
    }

    const channel = {
      fromPubKey,
      capacity,
      channelId,
      toPubKey: node1Pub === fromPubKey ? node2Pub : node1Pub,
      // we want the policy to reflect the policy required to transit the link, which is set by the node which will
      // send the HTLC, i.e. the `from` node
      policy: node1Pub === fromPubKey ? node1Policy : node2Policy
    }

    filtered.push(channel)

    return filtered
  }, [])
}

module.exports = executeSwap
