const { lookupInvoice } = require('../lnd-actions')

/**
 * Looks up whether or not an invoice has been paid
 *
 * @param {String} rHash - invoice request hash
 * @returns {Boolean} true if the invoice is settled, false if not
 */
async function isInvoicePaid (invoiceHash) {
  const { settled } = await lookupInvoice(invoiceHash, { client: this.client })
  return settled
}

module.exports = isInvoicePaid
