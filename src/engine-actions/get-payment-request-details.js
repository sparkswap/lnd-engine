const { decodePaymentRequest } = require('../lnd-actions')
/**
 * Returns an object with decoded paymentHash and numSatoshis of a payment request
 *
 * @param {String} payment request string to be decoded
 * @return {Object} with payment hash and value
 */
async function getPaymentRequestDetails (paymentRequestString) {
  const { paymentHash, numSatoshis } = await decodePaymentRequest(paymentRequestString, { client: this.client })
  return { paymentHash, value: numSatoshis }
}

module.exports = getPaymentRequestDetails
