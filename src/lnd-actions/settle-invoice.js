const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
* Settle a hold invoice
*
* @param {string} preimage - base64 preimage of the invoice hash
* @param {object} opts
* @param {LndClient} opts.client
* @returns {Promise<object>}
*/
function settleInvoice (preimage, { client }) {
  return new Promise((resolve, reject) => {
    client.invoices.settleInvoice({ preimage }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = settleInvoice
