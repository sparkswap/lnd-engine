const { deadline } = require('../grpc-utils')

/**
 * Sends a payment to a specified invoice
 *
 * @function
 * @see {@link http://api.lightning.community/#sendPaymentSync}
 * @return {Promise}
 */
function sendPayment (paymentRequest, { client }) {
  return new Promise((resolve, reject) => {
    client.sendPaymentSync({ paymentRequest }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendPayment
