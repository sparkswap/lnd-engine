const { settleInvoice } = require('../lnd-actions')

/**
* Settles the invoice for a swap
*
* @param {string} swapHash - hash of the swap
* @returns {Promise}
*/
async function settleSwap (swapHash) {
  return settleInvoice(swapHash, { client: this.client })
}

module.exports = settleSwap
