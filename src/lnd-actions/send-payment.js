const { deadline } = require('../grpc-utils')

/**
 * Sends a payment to a specified invoice
 *
 * @function
 * @see {@link http://api.lightning.community/#sendPaymentSync}
 * @param {String} paymentRequest
 * @param {String} destString - destination public key
 * @return {Promise}
 */
function sendPayment (paymentRequest, amt, { client }) {
  return new Promise((resolve, reject) => {
    client.sendPaymentSync({ paymentRequest, amt }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendPayment
