/**
 * @constant
 * @type {String}
 * @default
 */
const LTC_FEE_PER_KW = '7667'

/**
 * @constant
 * @type {String}
 * @default
 */
const BTC_FEE_PER_KW = '6667'

/**
 * @constant
 * @type {Array<key, string>}
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
