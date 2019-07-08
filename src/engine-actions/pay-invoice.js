const {
  sendPayment
} = require('../lnd-actions')

/**
 * Given a payment request, it pays the invoices and returns a refund invoice
 *
 * @param {String} paymentRequest
 * @return {Promise<string>} paymentPreimage
 */

async function payInvoice (paymentRequest) {
  const { paymentError, paymentPreimage } = await sendPayment({ paymentRequest }, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to pay invoice', { paymentRequest })
    throw new Error(paymentError)
  }

  this.logger.debug('Payment successfully made', { paymentRequest })

  return paymentPreimage
}

module.exports = payInvoice
