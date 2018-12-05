const { deadline } = require('../grpc-utils')

/**
 * Check's a payment's status
 *
 * @function
 * @param {String} paymentHash Base64 encoded payment hash for the desired payment
 * @return {Object} response
 * @return {String} response.status
 */
function lookupPaymentStatus (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupPaymentStatus({ rHash: paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = lookupPaymentStatus
