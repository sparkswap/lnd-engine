const { deadline } = require('../grpc-utils')

/**
 * SendPayment deadline (in seconds)
 * @constant
 * @type {Number}
 * @default
 */
const SEND_PAYMENT_DEADLINE = 30

/**
 * @typedef {Object} FeeLimit
 * @property {String} fixed Int64 string of max number of satoshis to pay in fees
 */

/**
 * Sends a payment to a specified invoice
 *
 * @function
 * @see {@link http://api.lightning.community/#sendPaymentSync}
 * @param {String}   paymentOptions.paymentRequest LN invoice
 * @param {String}   paymentOptions.paymentHash    Base64 string of the payment hash to use
 * @param {String}   paymentOptions.destString     destination public key
 * @param {String}   paymentOptions.amt            Int64 string of number of satoshis to send
 * @param {Number}   paymentOptions.finalCltvDelta Delta from the current block height to be used for the final hop
 * @param {FeeLimit} paymentOptions.feeLimit       Int64 string of maximum number of satoshis to pay in fees
 * @param {LND}      opts.client                   LND client to use
 * @return {Promise<Object>} Resolves with the response from LND
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
