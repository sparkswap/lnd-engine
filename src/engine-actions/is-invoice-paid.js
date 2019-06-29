const {
  decodePaymentRequest,
  lookupInvoice
} = require('../lnd-actions')
const {
  INVOICE_STATES
} = require('../constants')

/**
 * Looks up whether or not an invoice has been paid
 *
 * @see {lnd-actions#lookupinvoice}
 * @see {lnd-actions#decodePaymentRequest}
 * @param {string} paymentRequest
 * @returns {boolean} true if the invoice is settled, false if not
 */
async function isInvoicePaid (paymentRequest) {
  const { paymentHash } = await decodePaymentRequest(paymentRequest, { client: this.client })
  const rHash = Buffer.from(paymentHash, 'hex').toString('base64')
  const { state } = await lookupInvoice({ rHash }, { client: this.client })

  return state === INVOICE_STATES.SETTLED
}

module.exports = isInvoicePaid
