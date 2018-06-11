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
 * Given a pair of fee/deposit payment request, we pay those invoices and return
 * refund invoices w/ the fee/deposit amount
 *
 * @param {String} fee payment request hash
 * @param {String} deposit payment request hash
 * @param {Object} options
 * @param {Number} expiry expiration of refund invoices
 * @return {<Array<feerefund, depositrefund>} returns a matching pair of fee/deposit refund invoices
 */
async function sendFeePayments (feePaymentRequest, depositPaymentRequest, options = {}) {
  const [feeResult, depositResult] = await Promise.all([
    sendPayment(feePaymentRequest, { client: this.client }),
    sendPayment(depositPaymentRequest, { client: this.client })
  ])

  this.logger.debug('Fee result: ', feeResult)
  this.logger.debug('Deposit result: ', depositResult)

  const { paymentError: feeError } = feeResult
  const { paymentError: depositError } = depositResult

  if (feeError) throw new Error(feeError)
  if (depositError) throw new Error(depositError)

  const [fee, deposit] = await Promise.all([
    decodePaymentRequest(feePaymentRequest, { client: this.client }),
    decodePaymentRequest(depositPaymentRequest, { client: this.client })
  ])

  const { numSatoshis: feeRefundValue, description: feeDescription } = fee
  const { numSatoshis: depositRefundValue, description: depositDescription } = deposit

  const expiry = options.expiry || DEFAULT_INVOICE_EXPIRY

  const [feeRefund, depositRefund] = await Promise.all([
    addInvoice(`${REFUND_MEMO_PREFIX} ${feeDescription}`, expiry, feeRefundValue, { client: this.client }),
    addInvoice(`${REFUND_MEMO_PREFIX} ${depositDescription}`, expiry, depositRefundValue, { client: this.client })
  ])

  return [feeRefund, depositRefund]
}

module.exports = sendFeePayments
