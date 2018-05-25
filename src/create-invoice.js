const { addInvoice } = require('./lnd-actions')

async function createInvoice (memo, expiry, value) {
  const { rHash } = await addInvoice(memo, expiry, value, { client: this.client })
  return rHash
}

module.exports = createInvoice
