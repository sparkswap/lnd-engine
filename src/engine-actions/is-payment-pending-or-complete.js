const { lookupPaymentStatus } = require('../lnd-actions')

const PAYMENT_STATUSES = lookupPaymentStatus.STATUSES

/**
 * Retrieves whether a given payment (as indicated by its hash) is
 * currently in-progress or has successfully completed. Payments that
 * have failedor have never been started are considered not to be
 * pending or complete.
 *
 * @function
 * @param  {String} paymentHash Base64 encoded payment hash
 * @return {Boolean} true if a payment is in progress or completed; false otherwise
 */
async function isPaymentPendingOrComplete (paymentHash) {
  const { client } = this

  const { status } = await lookupPaymentStatus(paymentHash, { client })

  if (status === PAYMENT_STATUSES.GROUNDED) {
    return false
  }

  if (status === PAYMENT_STATUSES.IN_FLIGHT || status === PAYMENT_STATUSES.COMPLETE) {
    return true
  }

  throw new Error(`Unknown payment status ${status} for payment with hash '${paymentHash}'`)
}

module.exports = isPaymentPendingOrComplete
