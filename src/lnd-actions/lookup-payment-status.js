const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Payment Status corresponding to the output of
 * LND's LookupPaymentStatus RPC
 * @constant
 * @type {object}
 * @default
 */
const PAYMENT_STATUSES = Object.freeze({
  GROUNDED: 'GROUNDED',
  IN_FLIGHT: 'IN_FLIGHT',
  COMPLETED: 'COMPLETED'
})

/**
 * Checks a payment's status
 *
 * @param {string} paymentHash - Base64 encoded payment hash for the desired payment
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>} response
 */
function lookupPaymentStatus (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupPaymentStatus({ rHash: paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

lookupPaymentStatus.STATUSES = PAYMENT_STATUSES

module.exports = lookupPaymentStatus
