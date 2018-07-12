const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#subscribeInvoices}
 * @return {Object} response
 * @return {String} response.memo
 * @return {Number} response.value
 * @return {Date} response.settledDate
 * @return {Bool} response.settled
 */
function subscribeInvoices ({ client }) {
  return new Promise((resolve, reject) => {
    client.subscribeInvoices({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = subscribeInvoices
