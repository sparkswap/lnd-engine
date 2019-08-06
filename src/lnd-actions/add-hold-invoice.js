const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Creates a hold invoice on lnd
 *
 * @param {object} params
 * @param {string} params.memo
 * @param {string} params.expiry - invoice expiry in seconds
 * @param {string} params.cltvExpiry - cltv delta of the final hop in blocks
 * @param {string} params.value
 * @param {string} params.hash - hash of the preimage
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>} lightning invoice
 */
function addHoldInvoice (params, { client }) {
  return new Promise((resolve, reject) => {
    client.invoices.addHoldInvoice(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = addHoldInvoice
