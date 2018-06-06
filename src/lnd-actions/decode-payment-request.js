const { deadline } = require('../grpc-utils')

/**
 * Given an lnd payment request hash, try to decode the hash w/ a specified
 * lnd node
 *
 * @function
 * @see {@link https://api.lightning.community/#decodepayreq}
 * @return {String} paymentHash
 */
function decodePaymentRequest (paymentRequest, { client }) {
  return new Promise((resolve, reject) => {
    client.decodePayReq({ payReq: paymentRequest }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      const { paymentHash } = res
      return resolve(paymentHash)
    })
  })
}

module.exports = decodePaymentRequest
