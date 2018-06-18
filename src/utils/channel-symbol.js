const { LTC_FEE_MILLI_MSAT, BTC_FEE_MILLI_MSAT, SUPPORTED_SYMBOLS } = require('../config')

/**
 * Get the blockchain associated with a given channeel fee rate
 * @param  {String|Number} feeRate Int64 string or Number of the fee rate (proportional millionths) in mSat
 * @return {String}         `LTC` or `BTC`
 */
function symbolForFeeRate (feeRate) {
  feeRate = feeRate.toString()

  if (feeRate === LTC_FEE_MILLI_MSAT) {
    return SUPPORTED_SYMBOLS.LTC
  } else if (feeRate === BTC_FEE_MILLI_MSAT) {
    return SUPPORTED_SYMBOLS.BTC
  }
}

/**
 * Based on a specified channel type (as determined by the symbol) we return the applicable
 * feeRate for the type of currency.
 *
 * @param {String} symbol
 * @return {String} feeRate fee rate (proportional millionths) in mSat
 */
function feeRateForSymbol (symbol) {
  if (SUPPORTED_SYMBOLS[symbol] === SUPPORTED_SYMBOLS.BTC) return BTC_FEE_MILLI_MSAT
  if (SUPPORTED_SYMBOLS[symbol] === SUPPORTED_SYMBOLS.LTC) return LTC_FEE_MILLI_MSAT
}

/**
 * Guesses the symbol based off of the channel's policies
 * @param  {LND~RoutePolicy} node1Policy Route policy of one of the nodes in the channel
 * @param  {LND~RoutePolicy} node2Policy Route policy of the other node in the channel
 * @return {String}                      `BTC` or `LTC`
 * @throws {Error} If Policies indicate mismmatched symbols
 */
function getChannelSymbol (node1Policy, node2Policy) {
  const { feeRateMilliMsat: node1FeeRate } = node1Policy
  const { feeRateMilliMsat: node2FeeRate } = node2Policy
  const node1Symbol = symbolForFeeRate(node1FeeRate)
  const node2Symbol = symbolForFeeRate(node2FeeRate)

  if (node1Symbol && node2Symbol && node1Symbol !== node2Symbol) {
    throw new Error(`Channel fee mismatch: n1(${node2Symbol}), n2(${node2Symbol})`)
  }

  return node1Symbol || node2Symbol || false
}

module.exports = {
  symbolForFeeRate,
  feeRateForSymbol,
  getChannelSymbol
}
