const getInvoice = require('./get-invoice')

/**
 * Looks up whether or not an invoice has been paid
 *
 * @param {String} paymentRequest - an invoice's payment request
 * @returns {Boolean} true if the invoice is settled, false if not
 */
async function isInvoicePaid (paymentRequest) {
  const { settled } = await getInvoice(paymentRequest, { client: this.client })
  return settled
}

module.exports = isInvoicePaid
