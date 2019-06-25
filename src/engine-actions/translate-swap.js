const { Big, networkAddressFormatter, CLTV_DELTA } = require('../utils')
const { sendPayment } = require('../lnd-actions')

const {
  DEFAULT_MIN_FINAL_DELTA
} = CLTV_DELTA

/**
 * @typedef {Object} TranslateSwapOutcome
 * @property {String} paymentPreimage Base64 string of the preimage for the
 *                                    swapHash
 * @property {String} permanentError Error encountered that is permanent, and
 *                                   safe to cancel the upstream HTLC
 */

/**
 * Translates a swap to a new payment channel network by making a payment
 * to the counterparty (Taker) node on this network
 *
 * @param {string} takerAddress          - Payment channel network address of
 *                                         the Taker node we are paying
 * @param {string} swapHash              - swap hash that will be associated
 *                                         with the swap
 * @param {string} amount                - Int64 string of the amount of
 *                                         outbound currency in integer units
 * @param {string} maxTimeLockDeltaSecs  - Int64 string of the maximum timelock
 *                                         of the outgoing payment in seconds
 * @param {string} finalCltvDeltaSecs    - Int64 string of final hop time lock
 *                                         in seconds
 * @returns {TranslateSwapOutcome}
 */
async function translateSwap (takerAddress, swapHash, amount, maxTimeLockDeltaSecs, finalCltvDeltaSecs = DEFAULT_MIN_FINAL_DELTA) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`,
    { amount, maxTimeLockDeltaSecs })

  const { publicKey } = networkAddressFormatter.parse(takerAddress)

  // Translate seconds into blocks, rounding down to ensure we can stay atomic.
  // The LND api expects this to be an int32, which in javascript is a number.
  const cltvLimit = parseInt(Big(maxTimeLockDeltaSecs).div(this.secondsPerBlock).round(3), 10)

  // Translate seconds into blocks, rounding up so that we're sure the end
  // node will accept the payment. The LND api expects this to be an int32,
  // so we convert to a javascript number.
  const finalCltvDelta = parseInt(Big(finalCltvDeltaSecs).div(this.secondsPerBlock).round(0), 10)

  const {
    paymentPreimage,
    paymentError
  } = await sendPayment({
    paymentHash: swapHash,
    destString: publicKey,
    amt: amount,
    finalCltvDelta,
    cltvLimit
  }, { client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    return { permanentError: paymentError }
  }

  return { paymentPreimage }
}

module.exports = translateSwap
