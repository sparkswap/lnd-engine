const { lookupInvoices } = require('./lnd-actions')

async function getInvoice (invoiceHash) {
  const res = await lookupInvoices(invoiceHash, { client: this.client })
  return res
}

module.exports = getInvoice
