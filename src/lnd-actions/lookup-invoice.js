const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#lookupInvoice}
 * @param {String} paymentHash
 * @return {Object} response
 * @return {String} response.memo
 * @return {Number} response.value
 * @return {Date} response.settledDate
 * @return {Bool} response.settled
 */
function lookupInvoice (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupInvoice({ rHashStr: paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = lookupInvoice
