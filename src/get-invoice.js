const { lookupInvoices } = require('./lnd-actions')

async function getInvoice (invoiceHash) {
  return lookupInvoices(invoiceHash, { client: this.client })
}

module.exports = getInvoice
