const { Big, networkAddressFormatter, CLTV_DELTA } = require('../utils')
const { sendPayment } = require('../lnd-actions')

class PermanentSwapError extends Error {}

const {
  DEFAULT_MIN_FINAL_DELTA
} = CLTV_DELTA

/**
 * Default fee limit for swap routes.
 * We expect to route swaps through a fee-less hub.
 * @todo Make this value dynamic.
 */
const DEFAULT_FEE_LIMIT = '0'

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
 * @param {Date} maxTime                 - Absolute time representing the max
 *                                         time for a payment to resolve
 *                                         considering the time locks on the
 *                                         route.
 * @param {string} finalCltvDeltaSecs    - Int64 string of final hop time lock
 *                                         in seconds
 * @returns {Promise<string>} Base64 string of the preimage for the swapHash
 * @throws {PermanentSwapError} If an error is encountered while paying that we
 * are sure did not result in a still-active outbound HTLC for the swap hash.
 */
async function translateSwap (takerAddress, swapHash, amount, maxTime, finalCltvDeltaSecs = DEFAULT_MIN_FINAL_DELTA.toString()) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`,
    { amount, maxTime })

  const { publicKey } = networkAddressFormatter.parse(takerAddress)

  // Convert the maximum time into a time from now so we can convert it into
  // blocks of relative time. We round down to a whole number of seconds to
  // be conservative.
  const timeFromNow = Math.floor((maxTime.getTime() - (new Date()).getTime()) / 1000)

  // Translate seconds into blocks, rounding down to ensure we can stay atomic.
  // The LND api expects this to be an int32, which in javascript is a number.
  const cltvLimit = parseInt(Big(timeFromNow).div(this.secondsPerBlock).round(0, 0).toFixed(0), 10)

  // Translate seconds into blocks, rounding up so that we're sure the end
  // node will accept the payment. The LND api expects this to be an int32,
  // so we convert to a javascript number.
  const finalCltvDelta = parseInt(Big(finalCltvDeltaSecs).div(this.secondsPerBlock).round(0, 3).toFixed(0), 10)

  const {
    paymentPreimage,
    paymentError
  } = await sendPayment({
    paymentHash: swapHash,
    destString: publicKey,
    amt: amount,
    finalCltvDelta,
    cltvLimit,
    feeLimit: DEFAULT_FEE_LIMIT
  }, { client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    throw new PermanentSwapError(paymentError)
  }

  return paymentPreimage
}

module.exports = {
  translateSwap,
  PermanentSwapError
}
