const { addInvoice, decodePaymentRequest } = require('../lnd-actions')

/**
 * DEFAULT_INVOICE_EXPIRY
 * Default value is 2 minute expiry for invoices (in seconds)
 * @constant
 * @type {String}
 * @default
 */
const DEFAULT_INVOICE_EXPIRY = 120

/**
 * @constant
 * @type {String}
 * @default
 */
const REFUND_MEMO_PREFIX = 'REFUND:'
/**
 * Creates an invoice
 *
 * @param {String} paymentRequest
 * @returns {String} paymentRequest hash of invoice from lnd
 */

async function createRefundInvoice (paymentRequest) {
  const { numSatoshis: requestValue, description: requestDescription, expiry } = await decodePaymentRequest(paymentRequest, { client: this.client })

  this.logger.debug('Attempting to create invoice', { expiry, requestValue })

  const setExpiry = expiry || DEFAULT_INVOICE_EXPIRY
  // TODO: Use the settled value from an invoice lookup instead of the value from a decoded
  // payment request
  // see: https://trello.com/c/wzxVUNZl/288-check-fee-refund-values-on-relayer
  const { paymentRequest: refundPaymentRequest } = await addInvoice(`${REFUND_MEMO_PREFIX} ${requestDescription}`, setExpiry, requestValue, { client: this.client })

  return refundPaymentRequest
}

module.exports = createRefundInvoice
