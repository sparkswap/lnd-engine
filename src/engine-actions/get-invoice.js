const { lookupInvoice } = require('../lnd-actions')

async function getInvoice (invoiceHash) {
  return lookupInvoice(invoiceHash, { client: this.client })
}

module.exports = getInvoice
