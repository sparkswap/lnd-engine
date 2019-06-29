const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
* Settle a hold invoice
*
* @param {string} paymentHash
* @param {Object} opts
* @param {LndClient} opts.client
* @returns {Promise<Object>}
*/
function settleInvoice (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.invoices.settleInvoice({ paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = settleInvoice
