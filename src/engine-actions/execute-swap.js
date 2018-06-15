const { describeGraph, getInfo, listChannels, sendToRoute } = require('../lnd-actions')
const { LTC_FEE_PER_KW, BTC_FEE_PER_KW } = require('../config')
const { Big } = require('../utils')
const DEFAULT_CLTV_DELTA = '9'

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

  console.log('graph')
  console.log(graph)

  const hints = getBandwidthHints(channels, identityPubkey)

  console.log('hints')
  console.log(hints)

  // find paths
  const outboundPath = findPaths(graph.edges, hints, identityPubkey, counterpartyPubKey, outbound.symbol, outbound.amount)
  console.log('outboundPath')
  console.log(outboundPath)

  const inboundPath = findPaths(graph.edges, hints, counterpartyPubKey, identityPubkey, inbound.symbol, inbound.amount)
  console.log('inboundPath')
  console.log(inboundPath)

  if (!outboundPath || !inboundPath) {
    throw new Error(`Can't find a route between ${identityPubkey} and ${counterpartyPubKey} to swap ${outbound.amount} ${outbound.symbol} for ${inbound.amount} ${inbound.symbol}`)
  }

  // construct a valid route
  const route = routeFromPath(outbound.amount, Big(DEFAULT_CLTV_DELTA).plus(blockHeight), outboundPath.concat(inboundPath)) 

  console.log('route', route)
  console.log(route)

  const { paymentError, paymentPreimage } await sendToRoute(swapHash, route, { client: this.client })

  if(paymentError) {
    throw new Error(`Error from LND while sending to route: ${paymentError}`)
  }

  return paymentPreimage
}

/**
 * Construct a route (with fee and time lock data) from a selected path
 * @param {String} Int64 string of amount to send
 * @param {String} Int64 string of the final CLTV (i.e. current best block + final CLTV)
 * @param  {Array<InternalChannelEdge>} path Array of channel edges in order for the full path
 * @return {Object}      Route
 */
function routeFromPath(amountToSend, finalCLTV, path) {
  const amountToSendMsat = Big(amountToSend).times(1000)

  // we want to traverse the path in reverse so we can
  // build up to our final amount
  const backtrack = path.slice().reverse()

  let currentAmountMsat = amountToSendMsat
  let currentCLTV = Big(finalCLTV)

  const hops = backtrack.map((channel, index) => {
    const hop = {
      chanId: channel.channelId,
      chanCapacity: channel.capacity,
      expiry: currentCLTV.toString(),
      AmtToForwardMsat: currentAmountMsat.toString(),
      FeeMsat: null
    }

    // first in back track is our final destination
    if(index === 0) {
      // last hop: no fees
      hop.FeeMsat = '0'
    } else {
      hop.FeeMsat = computeFee(currentAmountMsat, channel.policy)
    }

    // last in the back track (i.e. our first hop in the route)
    // should not increment values, as we already have our final state
    if(index < hops.length - 1) {
      // update the current amount so we have enough funds to forward
      currentAmountMsat = currentAmountMsat.plus(hop.FeeMsat)
      // update the current cltv to have enough expiry
      currentCLTV = currentCLTV.plus(policy.timeLockDelta)
    }

    return hop
  }).reverse()

  return {
    hops: hops,
    totalTimeLock: currentCLTV.toString(),
    totalAmtMsat: currentAmountMsat.toString(),
    totalFeesMsat: currentAmountMsat.minus(amountToSendMsat).toString()
  }
}

/**
 * Compute the fee for a given hop
 * @param  {String} amount Int64 Amount, in millisatoshis, to compute the fee for
 * @param  {LND~RoutePolicy} policy Routing Policy for the hop
 * @return {String}        Int64 of the amount of the fee in millisatoshis
 */
function computeFee(amount, policy) {
  const baseFee = Big(policy.feeBaseMsat)
  const feeRate = Big(policy.feeRateMilliMsat)

  // fees are per million satoshis
  // we need to round up so that our fee will be accepted
  // @see {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/07-routing-gossip.md#htlc-fees}
  const variableFee = feeRate.times(amount).div(1000000).round(0, 3)

  return baseFee.plus(variableFee).toString()
}

function getBandwidthHints(channels, identityPubkey) {
  const activeChannels = channels.filter(c => c.active)

  const hints = {}

  activeChannels.forEach(channel => {
    const hint = {}

    hint[identityPubkey] = channel.localBalance
    hint[channel.remotePubkey] = channel.remoteBalance

    hints[channel.chanId] = hint
  })

  return hints
}

// naive path finding
async function findPaths (edges, hints, fromPubKey, toPubKey, symbol, amount, visited = []) {
  const candidates = findOutboundChannels(edges, fromPubKey, symbol, amount, visited)

  const endOfPath = candidates.find((channel) => {
    if(channel.toPubKey === toPubKey) {
      return true
    }
  })

  if (endOfPath) return [ endOfPath ]

  const paths = candidates.map(candidate => {
    const localVisited = visited.slice()
    localVisited.push(candidate.channelId)

    return [ candidate, ...findPaths(edges, hints, candidate.toPubKey, toPubKey, symbol, amount, localVisited) ].filter(segment => !!segment)
  }).filter(path => {
    const lastSegment = path[path.length - 1]
    return lastSegment.toPubKey === toPubKey
  })

  // if we have anything, return it
  return paths[0]
}

async function findOutboundChannels (edges, hints, fromPubKey, symbol, amount, visited = []) {
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
    let channelSymbol
    if (node1Policy.feeRateMilliMsat === LTC_FEE_PER_KW && node2Policy.feeRateMilliMsat === LTC_FEE_PER_KW) {
      channelSymbol = 'LTC'
    } else if (node1Policy.feeRateMilliMsat === BTC_FEE_PER_KW && node2Policy.feeRateMilliMsat === BTC_FEE_PER_KW) {
      channelSymbol = 'BTC'
    } else {
      throw new Error('Channel is on unidentified blockchain')
    }

    // not for our symbol
    if (channelSymbol !== symbol) {
      return filtered
    }

    /**
     * If we have bandwidth hints for this channel we should use them, otherwise fall back to capacity
     * @param  {Object} hints[channelId] Hints for balance on each side of this channel
     */
    if(hints[channelId]) {
      if(Big(hints[channelId][fromPubKey]).lt(amount)) {
        return filtered
      }
    } else {
      // not enough capacity
      if (Big(capacity).lt(amount)) {
        return filtered
      }
    }

    let toPubKey
    let policy

    if(node1Pub === fromPubKey) {
      toPubKey = node2Pub
      policy = node2Policy
    } else {
      toPubKey = node1Pub
      policy = node1Policy
    }

    filtered.push({ fromPubKey, toPubKey, capacity, channelId, policy })

    return filtered
  }, [])
}

module.exports = executeSwap
