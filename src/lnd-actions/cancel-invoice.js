const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Cancel a hold invoice
 *
 * @param {string} paymentHash
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
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
