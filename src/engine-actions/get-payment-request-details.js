const { decodePaymentRequest } = require('../lnd-actions')
/**
 * Returns an object with decoded paymentHash and numSatoshis of a payment request
 *
 * @param {String} payment request string to be decoded
 * @return {Promise}
 */
async function getPaymentRequestDetails (paymentRequestString) {
  return decodePaymentRequest(paymentRequestString, { client: this.client })
}

module.exports = getPaymentRequestDetails
