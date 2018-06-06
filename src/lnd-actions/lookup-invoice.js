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
  const rHashStr = paymentHash.toString('hex')

  return new Promise((resolve, reject) => {
    client.lookupInvoice({ rHashStr }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      const { memo, value, settledDate, settled } = res
      return resolve({ memo, value, settledDate, settled })
    })
  })
}

module.exports = lookupInvoice
