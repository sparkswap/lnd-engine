const { decodePaymentRequest } = require('../lnd-actions')

/**
 * Returns an object with decoded paymentHash and numSatoshis of a payment request
 *
 * @param {String} payment request string to be decoded
 * @return {Number} value
 */
async function getInvoiceValue (paymentRequestString) {
  const { numSatoshis } = await decodePaymentRequest(paymentRequestString, { client: this.client })
  return numSatoshis
}

module.exports = getInvoiceValue
