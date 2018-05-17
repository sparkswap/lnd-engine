/**
 * Invoice Status
 * @module src/lnd-actions/invoice-status
 */

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#lookupInvoice}
 * @param {String} rHash - invoice request hash
 * @return {Object} response
 */
function invoiceStatus (rHash) {
  return new Promise((resolve, reject) => {
    this.client.lookupInvoice({ rHash }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = invoiceStatus
