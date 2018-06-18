/**
 * LTC Channel fee in mSat
 *
 * @constant
 * @type {String}
 * @default
 */
const LTC_FEE_MILLI_MSAT = '7667'

/**
 * BTC Channel fee in mSat
 *
 * @constant
 * @type {String}
 * @default
 */
const BTC_FEE_MILLI_MSAT = '6667'

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
  LTC_FEE_MILLI_MSAT,
  BTC_FEE_MILLI_MSAT,
  SUPPORTED_SYMBOLS
}
