const { settleInvoice } = require('../lnd-actions')

/**
* Settles the invoice for a swap
*
* @param {string} preimage - base64 preimage of the swap hash
* @returns {Promise}
*/
async function settleSwap (preimage) {
  return settleInvoice(preimage, { client: this.client })
}

module.exports = settleSwap
