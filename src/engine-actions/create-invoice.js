const { addInvoice } = require('../lnd-actions')

/**
 * Creates an invoice
 *
 * @param {string} memo
 * @param {number} expiry - in seconds
 * @param {number} value
 * @returns {string} paymentRequest hash of invoice from lnd
 */
async function createInvoice (memo, expiry, value) {
  const { paymentRequest } = await addInvoice({ memo, expiry, value }, { client: this.client })
  return paymentRequest
}

module.exports = createInvoice
