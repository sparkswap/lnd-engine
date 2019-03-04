const { deadline } = require('../grpc-utils')

/**
 * Payment Status corresponding to the output of
 * LND's LookupPaymentStatus RPC
 * @constant
 * @type {Object}
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
 * @param {Object} options
 * @param {Object} options.client
 * @returns {Promise<Object>} response
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
