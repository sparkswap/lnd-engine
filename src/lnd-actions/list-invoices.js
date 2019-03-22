const { deadline } = require('../grpc-utils')

/**
 * Returns a list of invoices
 *
 * @param {boolean} pendingOnly - if true, returns only pending invoices
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function listInvoices (pendingOnly, { client }) {
  return new Promise((resolve, reject) => {
    client.listInvoices({ pendingOnly }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listInvoices
