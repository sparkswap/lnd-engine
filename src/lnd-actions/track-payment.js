/** @typedef {import('../lnd-setup').LndClient} LndClient */
/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/**
 * Payment Status corresponding to the output of LND's TrackPayment RPC
 *
 * IN_FLIGHT       - Payment is still in flight
 * SUCCEEDED       - Payment completed successfully
 * FAILED_TIMEOUT  - There are more routes to try, but the payment timeout was exceeded
 * FAILED_NO_ROUTE - All possible routes were tried and failed permanently. Or there
 *                   were no routes to the destination at all.
 *
 * @constant
 * @type {object}
 * @default
 */
const PAYMENT_STATUSES = Object.freeze({
  IN_FLIGHT: 'IN_FLIGHT',
  SUCCEEDED: 'SUCCEEDED',
  FAILED_TIMEOUT: 'FAILED_TIMEOUT',
  FAILED_NO_ROUTE: 'FAILED_NO_ROUTE'
})

/**
 * Tracks an existing payment
 * @param {string} paymentHash - Base64 encoded payment to track
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {ClientReadableStream} Readable stream from grpc
 */
function trackPayment (paymentHash, { client }) {
  return client.router.trackPayment({ paymentHash })
}

trackPayment.STATUSES = PAYMENT_STATUSES

module.exports = trackPayment
