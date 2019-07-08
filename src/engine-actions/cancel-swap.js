const { cancelInvoice } = require('../lnd-actions')

/**
 * Cancels the invoice for a swap
 *
 * @param {string} swapHash - hash of the swap
 * @returns {Promise<Object>}
 */
async function cancelSwap (swapHash) {
  return cancelInvoice(swapHash, { client: this.client })
}

module.exports = cancelSwap
