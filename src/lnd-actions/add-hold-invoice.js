const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Creates a hold invoice on lnd
 *
 * @param {Object} params
 * @param {string} params.memo
 * @param {string} params.expiry - invoice expiry in seconds
 * @param {string} params.value
 * @param {string} params.hash - hash of the preimage
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>} lightning invoice
 */
function addHoldInvoice ({ memo, expiry, value, hash }, { client }) {
  const params = {
    memo,
    expiry,
    value,
    hash
  }

  return new Promise((resolve, reject) => {
    client.invoices.addHoldInvoice(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = addHoldInvoice
