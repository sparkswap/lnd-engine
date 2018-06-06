const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#decodePayReq}
 * @param {String} payment request string to be decoded
 * @return {Object} response
 */
function decodePayReq (payReq, { client }) {
  return new Promise((resolve, reject) => {
    client.decodePayReq({ payReq }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = decodePayReq
