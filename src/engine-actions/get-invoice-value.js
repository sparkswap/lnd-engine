const { decodePaymentRequest } = require('../lnd-actions')

/**
 * Returns an object with decoded paymentHash and numSatoshis of a payment request
 *
 * @param {string} paymentRequestString - request string to be decoded
 * @returns {Promise<number>}
 */
async function getInvoiceValue (paymentRequestString) {
  const { numSatoshis } = await decodePaymentRequest(paymentRequestString, { client: this.client })
  return numSatoshis
}

module.exports = getInvoiceValue
