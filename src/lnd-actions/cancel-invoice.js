const { deadline } = require('../grpc-utils')

/**
 * Cancel a hold invoice
 *
 * @param {Bytes} paymentHash
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function cancelInvoice (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.invoices.cancelInvoice({ paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = cancelInvoice
