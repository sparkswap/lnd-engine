const Big = require('big.js')

const { listChannels } = require('../lnd-actions')
const {
  LTC_FEE_PER_KW,
  BTC_FEE_PER_KW,
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
 *
 * @param {Big} fee
 */
function feeToSymbol (fee) {
  if (LTC_FEE_PER_KW.eq(fee)) {
    return SUPPORTED_SYMBOLS.LTC
  } else if (BTC_FEE_PER_KW.eq(fee)) {
    return SUPPORTED_SYMBOLS.BTC
  }

  throw new Error('Unable to determine channel balances based off of fee')
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
    return balancesToHash(balances)
  }

  const updatedBalances = channels.reduce((acc, { feePerKw, localBalance }) => {
    const symbol = feeToSymbol(feePerKw)
    const balance = new Big(localBalance)

    acc[symbol] = acc[symbol].add(balance)
    return acc
  }, balances)

  return balancesToHash(updatedBalances)
}

module.exports = getChannelBalances
