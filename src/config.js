const Big = require('big.js')

/**
 * @constant
 * @type {Big}
 * @default
 */
const LTC_FEE_PER_KW = new Big(7667)

/**
 * @constant
 * @type {Big}
 * @default
 */
const BTC_FEE_PER_KW = new Big(6667)

/**
 * @constant
 * @type {Object<symbol, string>}
 * @default
 */
const SUPPORTED_SYMBOLS = Object.freeze({
  BTC: 'BTC',
  LTC: 'LTC'
})

module.exports = {
  LTC_FEE_PER_KW,
  BTC_FEE_PER_KW,
  SUPPORTED_SYMBOLS
}
