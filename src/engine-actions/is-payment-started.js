const { lookupPaymentStatus } = require('../lnd-actions')

/**
 * Payment Status corresponding to the output of
 * LND's LookupPaymentStatus RPC
 * @constant
 * @type {Object}
 */
const PAYMENT_STATUSES = Object.freeze({
  GROUNDED: 'GROUNED',
  IN_FLIGHT: 'IN_FLIGHT',
  COMPLETE: 'COMPLETE'
})

/**
 * Retrieves whether a given payment (as indicated by its hash) has
 * started. Payments that are currently in-progress or completed are
 * considered to have started, whereas payments that have failed
 * or have never been started are considered not to have started.
 *
 * @function
 * @param  {String} paymentHash Base64 encoded payment hash
 * @return {Boolean} true if a payment is in progress or completed; false otherwise
 */
async function isPaymentStarted (paymentHash) {
  const client = this.client

  const status = await lookupPaymentStatus(paymentHash, { client })

  if (status === PAYMENT_STATUSES.GROUNDED) {
    return false
  }

  if (status === PAYMENT_STATUSES.IN_FLIGHT || status === PAYMENT_STATUSES.COMPLETE) {
    return true
  }

  throw new Error(`Unknown payment status ${status} for payment with hash '${paymentHash}'`)
}

module.exports = isPaymentStarted
