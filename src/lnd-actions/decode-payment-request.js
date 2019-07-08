const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Given an lnd payment request hash, try to decode the hash w/ a specified
 * lnd node
 *
 * @see https://api.lightning.community/#decodepayreq
 * @param {string} paymentRequest
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function decodePaymentRequest (paymentRequest, { client }) {
  return new Promise((resolve, reject) => {
    client.decodePayReq({ payReq: paymentRequest }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = decodePaymentRequest
