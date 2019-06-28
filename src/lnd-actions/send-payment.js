const { deadline } = require('../grpc-utils')

/**
 * SendPayment deadline (in seconds)
 * @constant
 * @type {number}
 * @default
 */
const SEND_PAYMENT_DEADLINE = 30

/**
 * Sends a payment to a specified invoice
 *
 * @see http://api.lightning.community/#sendPaymentSync
 * @param {Object}  paymentOptions
 * @param {string=} paymentOptions.paymentRequest - Optional LN Payment Request
 * @param {string}  paymentOptions.paymentHash    - Base64 string of the payment
 *                                                  hash to use
 * @param {string}  paymentOptions.destString     - destination public key
 * @param {string}  paymentOptions.amt            - Int64 string of number of
 *                                                  satoshis to send
 * @param {number}  paymentOptions.finalCltvDelta - Delta from the current block
 *                                                  height to be used for the
 *                                                  final hop
 * @param {string}  paymentOptions.feeLimit       - Int64 string of maximum
 *                                                  number of satoshis to pay in
 *                                                  fees
 * @param {number}  paymentOptions.cltvLimit      - Maximum number of blocks in
 *                                                  the route timelock
 * @param {Object}  opts
 * @param {LndClient} opts.client                 - LND client to use
 * @returns {Promise<Object>} Resolves with the response from LND
 */
function sendPayment (paymentOptions, { client }) {
  return new Promise((resolve, reject) => {
    client.sendPaymentSync(paymentOptions, { deadline: deadline(SEND_PAYMENT_DEADLINE) }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendPayment
