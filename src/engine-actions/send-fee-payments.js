const {
  addInvoice,
  sendPayment,
  decodePaymentRequest
} = require('../lnd-actions')

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
 * Given a payment request, it pays the invoices and returns a refund invoice
 *
 * @param {String} paymentRequest
 * @param {Object} options
 * @param {Number} expiry expiration of refund invoices
 * @return {String} refundPaymentRequest
 */

async function payInvoice (paymentRequest, options = {}) {
  const { paymentError } = await sendPayment(paymentRequest, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to pay invoice', { paymentRequest })
    throw new Error(paymentError)
  }

  this.logger.debug('Payment successfully made', { paymentRequest })

  const { numSatoshis: requestValue, desciprtion: requestDescription } = await decodePaymentRequest(paymentRequest, { client: this.client })

  const expiry = options.expiry || DEFAULT_INVOICE_EXPIRY

  this.logger.debug('Attempting to create invoice', { expiry, requestValue })

  const { paymentRequest: refundPaymentRequest } = await addInvoice(`${REFUND_MEMO_PREFIX} ${requestDescription}`, expiry, requestValue, { client: this.client })

  return refundPaymentRequest
}

module.exports = payInvoice
