const { Big } = require('../utils')

const {
  listChannels,
  getChanInfo
} = require('../lnd-actions')
const {
  LTC_FEE_MILLI_MSAT,
  BTC_FEE_MILLI_MSAT,
  SUPPORTED_SYMBOLS
} = require('../config')

/**
 * @constant
 * @type {Big}
 * @default
 */
const DEFAULT_CHANNEL_BALANCE = new Big(0)

/**
 * Given a balance object, returns an array of symbol/value hashes
 *
 * @param {Object} balances
 * @return {Array<symbol, value>}
 */
function balancesToHash (balances) {
  return Object.entries(balances).map(([k, v]) => ({ symbol: k, value: v }))
}

/**
 * Guesses the symbol based off of a specified fee amount
 *
 * @param {String} chanId
 * @param {Object} client
 * @return {String} symbol
 * @return {false} if no symbol could be derived from fees
 */
async function getChannelTypeFromId (chanId, client) {
  const { node1Policy, node2Policy } = await getChanInfo(chanId, { client })
  const { feeRateMilliMsat: node1feerate } = node1Policy
  const { feeRateMilliMsat: node2feerate } = node2Policy

  if (node1feerate === LTC_FEE_MILLI_MSAT && node2feerate === BTC_FEE_MILLI_MSAT) {
    throw new Error('Channel fee mismatch has occurred and prevents the channel from being opened. n1: LTC, n2: BTC')
  }

  if (node1feerate === BTC_FEE_MILLI_MSAT && node2feerate === LTC_FEE_MILLI_MSAT) {
    throw new Error('Channel fee mismatch has occurred and prevents the channel from being opened. n1: BTC, n2: LTC')
  }

  if (node1feerate === LTC_FEE_MILLI_MSAT || node2feerate === LTC_FEE_MILLI_MSAT) {
    return SUPPORTED_SYMBOLS.LTC
  }

  if (node1feerate === BTC_FEE_MILLI_MSAT || node2feerate === BTC_FEE_MILLI_MSAT) {
    return SUPPORTED_SYMBOLS.BTC
  }

  return false
}

/**
 * Get committed balance of all channels
 *
 * @return {Array<Symbol, Big>}
 */
async function getChannelBalances () {
  const balances = Object.values(SUPPORTED_SYMBOLS).reduce((acc, s) => {
    acc[s] = DEFAULT_CHANNEL_BALANCE
    return acc
  }, {})

  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('getChannelBalances: No channels exist')
    return balancesToHash(balances)
  }

  // Using a for-in loop instead of reduce due to async w/ `getChannelTypeFromId`
  for (const { chanId, localBalance } of channels) {
    const symbol = await getChannelTypeFromId(chanId, this.client)

    if (!symbol) {
      this.logger.debug('Symbol could not be found from channel info', { chanId })
      continue
    }

    const balance = new Big(localBalance)
    balances[symbol] = balances[symbol].add(balance)
  }

  return balancesToHash(balances)
}

module.exports = getChannelBalances
