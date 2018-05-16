/**
 * Check's an invoice status
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
