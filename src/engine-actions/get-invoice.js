const { decodePaymentRequest } = require('../lnd-actions')

/**
 * Returns destination and satoshis from a decoded invoice
 *
 * @param {string} paymentRequestString - request string to be decoded
 * @returns {Promise<object>}
 */
async function getInvoice (paymentRequestString) {
  const {
    destination,
    numSatoshis
  } = await decodePaymentRequest(paymentRequestString, { client: this.client })

  return {
    destination,
    numSatoshis
  }
}

module.exports = getInvoice
