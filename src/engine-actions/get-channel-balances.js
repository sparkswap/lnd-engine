const Big = require('big.js')

const {
  listChannels,
  getChannelInfo
} = require('../lnd-actions')
const {
  LTC_FEE_MILLI_SAT,
  BTC_FEE_MILLI_SAT,
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
  const { node1Policy, node2Policy } = await getChannelInfo(chanId, { client })
  const { feeRateMilliMsat: node1feerate } = node1Policy
  const { feeRateMilliMsat: node2feerate } = node2Policy

  if (node1feerate === LTC_FEE_MILLI_SAT || node2feerate === LTC_FEE_MILLI_SAT) {
    return SUPPORTED_SYMBOLS.LTC
  }

  if (node1feerate === BTC_FEE_MILLI_SAT || node2feerate === BTC_FEE_MILLI_SAT) {
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

  const updatedBalances = channels.reduce((acc, { chanId, localBalance }) => {
    const symbol = getChannelTypeFromId(chanId, this.client)

    if (!symbol) {
      this.logger.debug('Symbol could not be found from channel info', { chanId })
      return acc
    }

    const balance = new Big(localBalance)

    this.logger.debug(balances)
    this.logger.debug(acc)
    this.logger.debug(symbol)
    this.logger.debug(balance)

    acc[symbol] = acc[symbol].add(balance)
    return acc
  }, balances)

  return balancesToHash(updatedBalances)
}

module.exports = getChannelBalances
