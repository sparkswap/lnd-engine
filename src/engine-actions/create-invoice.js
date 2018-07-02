const { addInvoice } = require('../lnd-actions')

/**
 * Creates an invoice
 *
 * @param {String} memo
 * @param {Number} expiry - in seconds
 * @param {Number} value
 * @returns {String} paymentRequest hash of invoice from lnd
 */
async function createInvoice (memo, expiry, value) {
  const { paymentRequest } = await addInvoice({ memo, expiry, value }, { client: this.client })
  return paymentRequest
}

module.exports = createInvoice
