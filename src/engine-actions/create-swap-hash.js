const { addInvoice } = require('../lnd-actions')

/**
 * default expiry for swap hashes is 3600 seconds - 1 hour.
 * @todo Should this be changed to something shorter or be configurable
 * @constant
 * @type {String}
 */
const SWAP_EXPIRY = '3600'

/**
 * The memo prefix allows us to easily find SparkSwap-related invoices
 * in LND. In this case, the invoice is the end point of the swap, its
 * "terminus".
 *
 * @constant
 * @type {String}
 * @default
 */
const MEMO_PREFIX = 'sparkswap-swap-terminus:'

/**
 * Creates a swap hash to prepare for a swap
 *
 * @param {String} orderId order ID for the swap hash
 * @param {Number} value
 * @returns {String} rHash hash of invoice from lnd
 */
async function createSwapHash (orderId, value) {
  const params = {
    memo: `${MEMO_PREFIX}${orderId}`,
    value,
    expiry: SWAP_EXPIRY,
    externalPreimage: true,
    rHash: '20/REAranviIs1SBeMUPwsMhgMwuo/62scpMsJS9frg='
  }

  const { rHash } = await addInvoice(params, { client: this.client })
  return rHash
}

module.exports = createSwapHash
