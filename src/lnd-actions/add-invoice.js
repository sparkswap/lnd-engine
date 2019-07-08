const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Creates an invoice on lnd
 *
 * @see http://api.lightning.community/#addinvoice
 * @param {Object} params
 * @param {string} params.memo
 * @param {string} params.expiry - invoice expiry in seconds
 * @param {string} params.value
 * @param {boolean} [params.externalPreimage] - Whether the preimage is stored locally or on an external server
 * @param {string} [params.rHash] - Optional Base64 string of the hash for the invoice
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<{rHash: string, paymentRequest: string}>}
 */
function addInvoice ({ memo, expiry, value, externalPreimage, rHash }, { client }) {
  const params = {
    memo,
    expiry,
    value,
    externalPreimage,
    rHash
  }

  return new Promise((resolve, reject) => {
    client.addInvoice(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = addInvoice
