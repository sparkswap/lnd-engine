const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of invoices
 *
 * @param {boolean} pendingOnly - if true, returns only pending invoices
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
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
