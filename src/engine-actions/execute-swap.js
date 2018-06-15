const { describeGraph, getInfo } = require('../lnd-actions')
const { LTC_FEE_PER_KW, BTC_FEE_PER_KW } = require('../config')
const { Big } = require('../utils')

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
  const [ graph, { identityPubkey } ] = await Promise.all([
    describeGraph({ client: this.client }),
    getInfo({ client: this.client })
  ])

  console.log('graph')
  console.log(graph)

  // find paths
  const outboundPath = findPaths(graph.edges, identityPubkey, counterpartyPubKey, outbound.symbol, outbound.amount)
  console.log('outboundPath')
  console.log(outboundPath)

  const inboundPath = findPaths(graph.edges, counterpartyPubKey, identityPubkey, inbound.symbol, inbound.amount)
  console.log('inboundPath')
  console.log(inboundPath)

  if (!outboundPath || !inboundPath) {
    throw new Error(`Can't find a route between ${identityPubkey} and ${counterpartyPubKey} to swap ${outbound.amount} ${outbound.symbol} for ${inbound.amount} ${inbound.symbol}`)
  }

  // construct a valid route

  // TODO: send to route
}

// naive path finding
async function findPaths (edges, fromPubKey, toPubKey, symbol, amount, visited = []) {
  const candidates = findOutboundChannels(edges, fromPubKey, symbol, amount, visited)

  const endOfPath = candidates.find(({ node1Pub, node2Pub, channelId }) => {
    if ((node1Pub === fromPubKey && node2Pub === toPubKey) || (node1Pub === toPubKey && node2Pub === fromPubKey)) {
      return true
    }
  })

  if (endOfPath) return [ endOfPath ]

  const paths = candidates.map(candidate => {
    const { node1Pub, node2Pub } = candidate
    const nextPubKey = node1Pub === fromPubKey ? node2Pub : node1Pub

    const localVisited = visited.slice()
    localVisited.push(candidate.channelId)

    return [ candidate, ...findPaths(edges, nextPubKey, toPubKey, symbol, amount, localVisited) ].filter(segment => !!segment)
  }).filter(path => {
    const { node1Pub, node2Pub } = path[path.length - 1]
    return node1Pub === toPubKey || node2Pub === toPubKey
  })

  // if we have anything, return it
  return paths[0]
}

async function findOutboundChannels (edges, fromPubKey, symbol, amount, visited = []) {
  return edges.filter(({ node1Pub, node2Pub, capacity, node1Policy, node2Policy, channelId }) => {
    // don't retrace
    if (visited.includes(channelId)) {
      return false
    }

    // neither node is ours
    if (node1Pub !== fromPubKey && node2Pub !== fromPubKey) {
      return false
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
      return false
    }

    // not enough capacity
    if (Big(capacity).lt(amount)) {
      return false
    }

    return true
  })
}

module.exports = executeSwap
