const { addInvoice } = require('./lnd-actions')

/**
 * Creates an invoice
 *
 * @param {String} memo
 * @param {Number} expiry - in seconds
 * @param {Number} value
 */
async function createInvoice (memo, expiry, value) {
  const { rHash } = await addInvoice(memo, expiry, value, { client: this.client })
  return rHash
}

module.exports = createInvoice
