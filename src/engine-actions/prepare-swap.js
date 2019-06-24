const { addHoldInvoice, lookupInvoice } = require('../lnd-actions')

/**
 * The memo prefix allows us to easily find SparkSwap-related invoices
 * in LND. In this case, the invoice is the pivot point of the swap
 * where it changes chains.
 * @constant
 * @type {String}
 * @default
 */
const MEMO_PREFIX = 'sparkswap-swap-pivot:'

/**
 * Prepares for a swap in which this node is the counterparty to the intiating node
 *
 * @param {string} orderId - Order for which the swap is being executed
 * @param {string} swapHash - swap hash that will be associated with the swap
 * @param {string} value - Int64 string of the value of inbound currency
 * @param {number} expiry - payment request expiry time in seconds
 * @param {number} cltvExpiry - delta to use for the time-lock of the CLTV
 *                              extended to the final hop (in blocks)
 * @returns {string} paymentRequest - lightning invoice for a payment
 */
async function prepareSwap (orderId, swapHash, value, expiry, cltvExpiry) {
  this.logger.info(`Preparing swap for ${swapHash}`, { value })

  // make prepareSwap idempotent by returning the existing invoice if one exists
  try {
    const { paymentRequest } = await lookupInvoice(swapHash, { client: this.client })
    return paymentRequest
  } catch (e) {
    const params = {
      memo: `${MEMO_PREFIX}${orderId}`,
      hash: swapHash,
      value,
      expiry,
      cltvExpiry
    }

    const { paymentRequest } = await addHoldInvoice(params, { client: this.client })
    return paymentRequest
  }
}

module.exports = prepareSwap
