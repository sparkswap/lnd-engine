const {
  decodePaymentRequest,
  lookupInvoice
} = require('../lnd-actions')

/**
 * Looks up whether or not an invoice has been paid
 *
 * @see {lnd-actions#lookupinvoice}
 * @see {lnd-actions#decodePaymentRequest}
 * @param {string} paymentRequestHash
 * @returns {boolean} true if the invoice is settled, false if not
 */
async function isInvoicePaid (paymentRequestHash) {
  const { paymentHash } = await decodePaymentRequest(paymentRequestHash, { client: this.client })
  const { settled } = await lookupInvoice(paymentHash, { client: this.client })

  return settled
}

module.exports = isInvoicePaid
