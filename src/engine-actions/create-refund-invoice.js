const { addInvoice, decodePaymentRequest } = require('../lnd-actions')

/**
 * DEFAULT_INVOICE_EXPIRY
 * Default value is 1 year expiry for invoices (in seconds)
 * @constant
 * @type {String}
 * @default
 */
const DEFAULT_INVOICE_EXPIRY = 31536000

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
  const { numSatoshis: requestValue, description: requestDescription } = await decodePaymentRequest(paymentRequest, { client: this.client })

  this.logger.debug('Attempting to create invoice', { requestValue, paymentRequest })

  // TODO: Use the settled value from an invoice lookup instead of the value from a decoded
  // payment request
  // see: https://trello.com/c/wzxVUNZl/288-check-fee-refund-values-on-relayer
  const params = {
    memo: `${REFUND_MEMO_PREFIX} ${requestDescription}`,
    expiry: DEFAULT_INVOICE_EXPIRY,
    value: requestValue
  }
  const { paymentRequest: refundPaymentRequest } = await addInvoice(params, { client: this.client })

  return refundPaymentRequest
}

module.exports = createRefundInvoice
