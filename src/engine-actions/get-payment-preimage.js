const { trackPayment } = require('../lnd-actions')

/**
 * The different known status updates streamed from trackPayment
 * @constant
 * @type {Object}
 * @default
 */
const PAYMENT_STATUSES = trackPayment.STATUSES

/**
 * @typedef {Object} GetPaymentPreimageOutcome
 * @property {string} paymentPreimage Base64 string of the preimage for the paymentHash
 * @property {string} permanentError Error encountered that is permanent, and safe to cancel the upstream HTLC
 */

/**
 * Retrieves the preimage for given payment hash. If the payment is
 * still in-flight, it will wait until the payment is completed and
 * then return the hash.
 *
 * @param  {string} paymentHash - Base64 encoded payment hash
 * @returns {Promise<GetPaymentPreimageOutcome>}
 * @throws {Error} If payment is in an unknown status
 */
async function getPaymentPreimage (paymentHash) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!paymentHash) {
        throw new Error('paymentHash must be defined')
      }

      this.logger.debug('Attempting to track payment for paymentHash:', { paymentHash })

      const stream = await trackPayment(paymentHash, { client: this.client })

      const errorListener = (err) => {
        // TODO: handle gRPC NOT FOUND errors
        //  It may be best to handle it as a `permanentError`, so we don't have to
        //  rely on checking NOT FOUND in downstream logic
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

module.exports = getPaymentPreimage
