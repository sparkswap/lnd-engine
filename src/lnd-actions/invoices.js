/**
 * Invoice
 * @module src/lnd-actions/invoice
 */

/**
 * Creates an invoice
 *
 * @function
 * @see {@link http://api.lightning.community/#addinvoice}
 * @param {Object} params
 * @returns {Promise} addInvoice
 */
function create (params) {
  return new Promise((resolve, reject) => {
    this.client.addInvoice(params, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#lookupInvoice}
 * @param {String} rHash - invoice request hash
 * @return {Object} response
 */
function status (rHash) {
  return new Promise((resolve, reject) => {
    this.client.lookupInvoice({ rHash }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = {
  create,
  status
}
