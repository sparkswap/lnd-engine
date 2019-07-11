const { cancelInvoice } = require('../lnd-actions')

/**
 * Cancels the invoice for a swap
 *
 * @param {string} swapHash - hash of the swap
 * @returns {Promise<object>}
 */
async function cancelSwap (swapHash) {
  return cancelInvoice(swapHash, { client: this.client })
}

module.exports = cancelSwap
