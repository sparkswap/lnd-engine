const {
  decodePaymentRequest,
  lookupInvoice
} = require('../lnd-actions')

/**
 * Returns information about an invoice from its payment request hash
 *
 * @see {lnd-actions#lookupinvoice}
 * @see {lnd-actions#decodePaymentRequest}
 * @param {String} paymentRequestHash
 * @return {Object} response
 * @return {String} response.memo
 * @return {Number} response.value
 * @return {Date} response.settledDate
 * @return {Bool} response.settled
 */
async function getInvoice (paymentRequestHash) {
  this.logger.debug('Making request to decode payment request')

  const { paymentHash } = await decodePaymentRequest(paymentRequestHash, { client: this.client })

  this.logger.debug('Received payment hash from lnd', paymentHash)
  this.logger.debug('Looking up invoice by paymentHash', paymentHash)

  const { memo, value, settledDate, settled } = await lookupInvoice(paymentHash, { client: this.client })

  return { memo, value, settledDate, settled }
}

module.exports = getInvoice
