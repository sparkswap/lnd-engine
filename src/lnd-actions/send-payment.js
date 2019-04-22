const { deadline } = require('../grpc-utils')

/**
 * SendPayment deadline (in seconds)
 * @constant
 * @type {number}
 * @default
 */
const SEND_PAYMENT_DEADLINE = 120

/**
 * Sends a payment to a specified invoice
 *
 * @see http://api.lightning.community/#sendPaymentSync
 * @param {Object} paymentOptions
 * @param {string} paymentOptions.paymentRequest - LN invoice
 * @param {string} paymentOptions.paymentHash    - Base64 string of the payment hash to use
 * @param {string} paymentOptions.destString     - destination public key
 * @param {string} paymentOptions.amt            - Int64 string of number of satoshis to send
 * @param {number} paymentOptions.finalCltvDelta - Delta from the current block height to be used for the final hop
 * @param {string} paymentOptions.feeLimit       - Int64 string of maximum number of satoshis to pay in fees
 * @param {Object} opts
 * @param {LndClient} opts.client - LND client to use
 * @returns {Promise<Object>} Resolves with the response from LND
 */
function sendPayment ({ paymentRequest, paymentHash, destString, amt, finalCltvDelta, feeLimit }, { client }) {
  const request = { paymentRequest, paymentHash, destString, amt, finalCltvDelta, feeLimit }

  return new Promise((resolve, reject) => {
    client.sendPaymentSync(request, { deadline: deadline(SEND_PAYMENT_DEADLINE) }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendPayment
