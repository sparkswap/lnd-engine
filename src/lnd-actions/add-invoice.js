/**
 * Add Invoice
 *
 * @see lightning#addInvoice http://api.lightning.community/#addinvoice
 * @param {Object} params
 * @returns {Promise} addInvoice
 */
function addInvoice (params) {
  return new Promise((resolve, reject) => {
    this.client.addInvoice(params, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = addInvoice
