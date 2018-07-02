const { addInvoice } = require('../lnd-actions')

/**
 * default expiry for swaps is 3600 seconds - 1 hour.
 * @todo Should this be changed to something shorter or be configurable
 * @todo Does this need to be dynamic based on the swap hash invoice
 * @constant
 * @type {String}
 */
const SWAP_EXPIRY = '3600'

/**
 * The memo prefix allows us to easily find Kinesis-related invoices
 * in LND. In this case, the invoice is the pivot point of the swap
 * where it changes chains.
 * @constant
 * @type {String}
 * @default
 */
const MEMO_PREFIX = 'kinesis-swap-pivot:'

/**
 * Prepares for a swap in which this node is the counterparty to the intiating node
 *
 * @param {String} orderId Order for which the swap is being executed
 * @param {String} swapHash        swap hash that will be associated with the swap
 * @param {String} value   Int64 string of the value of inbound currency
 * @returns {String} swapHash      Hash that will be translated
 */
async function prepareSwap (orderId, swapHash, value) {
  this.logger.info(`Preparing swap for ${swapHash}`, { value })

  const params = {
    memo: `${MEMO_PREFIX}${orderId}`,
    value,
    expiry: SWAP_EXPIRY,
    externalPreimage: true,
    rHash: swapHash
  }

  const { rHash } = await addInvoice(params, { client: this.client })

  if (rHash !== swapHash) {
    throw new Error(
      `Error while preparing for swap: returned rHash did not match passed swapHash: rHash=${rHash}, swapHash=${swapHash}`
    )
  }

  return swapHash
}

module.exports = prepareSwap
