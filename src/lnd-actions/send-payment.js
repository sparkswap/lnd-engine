/** @typedef {import('../lnd-setup').LndClient} LndClient */
/** @typedef {import('..').Logger} Logger */

// TODO: verify this against BOLT 11
/** @typedef {object} SendPaymentRequestFormatA
 * @property {string}  paymentOptions.paymentHash -
 *   Base64 string of the payment hash to use
 * @property {string}  paymentOptions.destString -
 *   destination public key
 * @property {string}  paymentOptions.amt -
 *   Int64 string of number of satoshis to send
 * @property {number}  paymentOptions.finalCltvDelta -
 *   Delta from the current block height to be used for the final hop
 * @property {object}  paymentOptions.feeLimit
 * @property {string} [paymentOptions.feeLimit.fixed] -
 *   Int64 string of maximum number of satoshis to pay in fees
 * @property {string} [paymentOptions.feeLimit.percent] -
 *   Int64 string of fee limit exepressed as a pecentage of payment amount
 * @property {number}  [paymentOptions.cltvLimit] -
 *   Maximum number of blocks in the route timelock
 */

/** @typedef {object} SendPaymentRequestFormatB
 * @property {string} paymentOptions.paymentRequest - LN Payment Request
 */

/** @typedef {SendPaymentRequestFormatA | SendPaymentRequestFormatB}
 *    SendPaymentRequest
 */

/**
 * Sends a payment to a specified invoice
 *
 * @see http://api.lightning.community/#sendPaymentSync
 * @param {SendPaymentRequest} paymentOptions
 * @param {object} opts
 * @param {LndClient} opts.client
 * @param {Logger} opts.logger
 * @returns {Promise<object>} Resolves with the response from LND
 */
function sendPayment (paymentOptions, { client, logger }) {
  return new Promise((resolve, reject) => {
    try {
      const call = client.router.sendPayment(paymentOptions)

      call.on('data', data => {
        if (data.paymentError) {
          return reject(data.paymentError)
        }

        return resolve(call.end())
      })
      call.on('status', status => logger.info(status))
    } catch (error) {
      logger.error('sendPayment rpc call failed')
      return reject(error)
    }
  })
}

module.exports = sendPayment
