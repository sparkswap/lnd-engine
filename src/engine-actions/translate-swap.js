const { Big, networkAddressFormatter, CLTV_DELTA } = require('../utils')
const {
  sendPayment,
  trackPayment
} = require('../lnd-actions')
const grpc = require('grpc')

class PermanentSwapError extends Error {}

const {
  DEFAULT_MIN_FINAL_DELTA
} = CLTV_DELTA

/**
 * Default fee limit for swap routes.
 * We expect to route swaps through a fee-less hub.
 * @todo Make this value dynamic.
 */
const DEFAULT_FEE_LIMIT = 0

/**
 * The different known status updates streamed from trackPayment
 * @constant
 * @type {Object}
 * @default
 */
const PAYMENT_STATUSES = trackPayment.STATUSES

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
 * @returns {string} Base64 string of the preimage for the swapHash
 * @throws {PermanentSwapError} If an error is encountered while paying that we
 * are sure did not result in a still-active outbound HTLC for the swap hash.
 */
async function translateSwap (takerAddress, swapHash, amount, maxTime, finalCltvDeltaSecs = DEFAULT_MIN_FINAL_DELTA) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`,
    { amount, maxTime })

  // To ensure translateSwap is idempotent, we first make a call to
  // getPreimageIfPaymentExists to make sure we don't have an existing payment
  // that is either In-Flight, Completed, or Failed. If there is not an existing
  // preimage for the provided swapHash, we can be confident that a call to
  // sendPayment will result in creating only one downstream payment for this swap
  try {
    // we await so rejections are handled within this function
    const paymentPreimage = await getPreimageIfPaymentExists(swapHash)

    return paymentPreimage
  } catch (e) {
    // If our call to LND returned a gRPC NOT FOUND error, we can be confident there
    // isn't an existing payment for the provided swapHash, so we can create a new
    // payment with a call to sendPayment
    if (e.code !== grpc.status.NOT_FOUND) {
      throw new PermanentSwapError(e)
    }

    const { publicKey } = networkAddressFormatter.parse(takerAddress)

    // Convert the maximum time into a time from now so we can convert it into
    // blocks of relative time. We round down to a whole number of seconds to
    // be conservative.
    const timeFromNow = Math.floor((maxTime - new Date()) / 1000)

    // Translate seconds into blocks, rounding down to ensure we can stay atomic.
    // The LND api expects this to be an int32, which in javascript is a number.
    const cltvLimit = parseInt(Big(timeFromNow).div(this.secondsPerBlock).round(3).toFixed(0), 10)

    // Translate seconds into blocks, rounding up so that we're sure the end
    // node will accept the payment. The LND api expects this to be an int32,
    // so we convert to a javascript number.
    const finalCltvDelta = parseInt(Big(finalCltvDeltaSecs).div(this.secondsPerBlock).round(0).toFixed(0), 10)

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
}

/**
 * Retrieve the preimage for the given payment hash. If no payment is found
 * for the hash, it will throw a gRPC NOT FOUND error. If the payment is
 * in-flight, it will wait until the payment succeeds or is in a permanent
 * failure state.
 * @param {string} paymentHash - Base64 encoded payment hash
 * @returns {Promise<string>} - Base64 encoded string of the preimage
 */
async function getPreimageIfPaymentExists (paymentHash) {
  return new Promise((resolve, reject) => {
    try {
      if (!paymentHash) {
        throw new Error('paymentHash must be defined')
      }

      this.logger.debug('Attempting to track payment for paymentHash:', { paymentHash })
      const stream = trackPayment(paymentHash, { client: this.client })

      const errorListener = (err) => {
        this.logger.error('Error from trackPayment stream', { paymentHash })
        stream.removeAllListeners()
        return reject(err)
      }

      const endListener = () => {
        this.logger.error('LND closed trackPayment stream before returning our value')
        stream.removeAllListeners()
        return reject(new Error('LND closed stream to track payment'))
      }

      const dataListener = (response) => {
        const { state, preimage } = response

        if (state === PAYMENT_STATUSES.IN_FLIGHT) {
          // trackPayment will continue to stream updates of the payment state, so
          // no action is required on our end
          return this.logger.debug('Payment is In-Flight for paymentHash:', { paymentHash })
        }

        if (state === PAYMENT_STATUSES.SUCCEEDED) {
          if (!preimage) {
            stream.removeAllListeners()
            return reject(new Error('No preimage associated with successful payment'))
          }

          this.logger.debug('Payment has Succeeded for paymentHash', { paymentHash })
          stream.removeAllListeners()
          return resolve(preimage)
        }

        if (state === PAYMENT_STATUSES.FAILED_TIMEOUT || state === PAYMENT_STATUSES.FAILED_NO_ROUTE) {
          this.logger.error('Payment failed', { paymentHash })

          stream.removeAllListeners()
          return reject(new Error(`Payment failed for paymentHash: ${paymentHash}`))
        }

        stream.removeAllListeners()
        const errMsg = `Unknown payment status ${state} for payment withhash '${paymentHash}'`
        return reject(new Error(errMsg))
      }

      stream.on('error', errorListener)
      stream.on('end', endListener)
      stream.on('data', dataListener)
    } catch (e) {
      return reject(e)
    }
  })
}

module.exports = {
  translateSwap,
  PermanentSwapError
}
