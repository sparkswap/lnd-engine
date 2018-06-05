const { lookupInvoice } = require('../lnd-actions')

async function isInvoicePaid (invoiceHash) {
  const { settled } = await lookupInvoice(invoiceHash, { client: this.client })
  return settled
}

module.exports = isInvoicePaid
