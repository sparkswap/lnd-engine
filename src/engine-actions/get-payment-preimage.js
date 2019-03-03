const { delay } = require('../utils')
const {
  lookupPaymentStatus,
  listPayments
} = require('../lnd-actions')

const PAYMENT_STATUSES = lookupPaymentStatus.STATUSES

/**
 * Milliseconds to wait between polling attempts on payment's
 * status.
 * @constant
 * @type {number}
 * @default
 */
const POLLING_INTERVAL = 10000

/**
 * @typedef {Object} GetPaymentPreimageOutcome
 * @property {string} paymentPreimage Base64 string of the preimage for the paymentHash
 * @property {string} permanentError Error encountered that is permanent, and safe to cancel the upstream HTLC
 */

/**
 * Retrieves the preimage for given payment hash. If the payment is
 * still in-flight, it will wait until the payment is completed and
 * then return the hash.
 *
 * @param  {string} paymentHash - Base64 encoded payment hash
 * @returns {GetPaymentPreimageOutcome}
 * @throws {Error} If payment is in an unknown status
 */
async function getPaymentPreimage (paymentHash) {
  const { client, logger } = this
  const { status } = await lookupPaymentStatus(paymentHash, { client })

  if (status === PAYMENT_STATUSES.GROUNDED) {
    return { permanentError: `No payment with hash '${paymentHash}' is in-flight or complete` }
  }

  if (status === PAYMENT_STATUSES.COMPLETED) {
    return { paymentPreimage: await getCompletedPreimage(paymentHash, { logger, client }) }
  }

  if (status === PAYMENT_STATUSES.IN_FLIGHT) {
    // if the payment is still in-flight, we'll wait and try again later
    await delay(POLLING_INTERVAL)
    return getPaymentPreimage.call(this, paymentHash)
  }

  throw new Error(`Unknown payment status ${status} for payment with hash '${paymentHash}'`)
}

/**
 * Retrieve the preimage for a completed payment specified by the payment
 * hash.
 * @todo LND has a known issue preventing payments that are settled after a restart
 *       showing up in this list, which will mistakenly throw an error.
 *       {@link https://github.com/lightningnetwork/lnd/issues/2032}
 * @param  {string} paymentHash - Base64 encoded payment hash
 * @param  {Object} options
 * @param  {LndClient} options.client
 * @returns {string} Base64 encoded payment preimage associated with the hash
 * @throws {Error} If payment is not completed
 */
async function getCompletedPreimage (paymentHash, { logger, client }) {
  const { payments = [] } = await listPayments({ client })

  logger.debug(`Found ${payments.length} completed payments`)

  const paymentHashBuf = Buffer.from(paymentHash, 'base64')
  const payment = payments.find(({ paymentHash }) => {
    // `paymentHash` returned from ListPayments {@link https://api.lightning.community/#payment}
    // is a hex string. We need to compare to our payment hash which is a base64 string,
    // so we convert both to buffers to do the comparison.
    return paymentHashBuf.equals(Buffer.from(paymentHash, 'hex'))
  })

  if (!payment) {
    throw new Error(`No completed payment with hash '${paymentHash}' exists.`)
  }

  // like the `paymentHash`, the `paymentPreimage` is returned as a hex string from LND,
  // so we convert to Base64 before returning
  return Buffer.from(payment.paymentPreimage, 'hex').toString('base64')
}

module.exports = getPaymentPreimage
