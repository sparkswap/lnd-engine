const { addInvoice } = require('../lnd-actions')

/**
 * Creates an invoice
 *
 * @param {string} memo
 * @param {string} expiry - in seconds
 * @param {string} value
 * @returns {Promise<string>} paymentRequest hash of invoice from lnd
 */
async function createInvoice (memo, expiry, value) {
  const { paymentRequest } = await addInvoice({ memo, expiry, value }, { client: this.client })
  return paymentRequest
}

module.exports = createInvoice
