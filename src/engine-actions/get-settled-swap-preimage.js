const {
  lookupInvoice
} = require('../lnd-actions')

const INVOICE_STATES = Object.freeze({
  SETTLED: 'SETTLED'
})

/**
 * Gets the preimage for a settled swap hash.
 *
 * @see {lnd-actions#lookupinvoice}
 * @see http://api.lightning.community/#addinvoice
 * @see {lnd-actions#subscribeInvoices}
 * @param {string} swapHash - Base64 encoded hash for the invoice
 * @returns {string} Base64 encoded preimage for the hash
 * @throws {Error} If the invoice is not in a SETTLED state
 */
async function getSettledSwapPreimage (swapHash) {
  if (!swapHash) {
    throw new Error('Swap hash must be defined')
  }

  // We convert the swapHash from base64 string to hex because lookupInvoice takes in a hex
  // encoded rhash as an argument.
  const paymentHash = Buffer.from(swapHash, 'base64').toString('hex')

  this.logger.debug('Looking up invoice by paymentHash:', { paymentHash })

  const { state, rPreimage } = await lookupInvoice(paymentHash, { client: this.client })

  this.logger.debug('Invoice has been retrieved: ', { state })

  if (state !== INVOICE_STATES.SETTLED) {
    throw new Error(`Cannot retrieve preimage from an invoice in a ${state} state.`)
  }

  return rPreimage
}

module.exports = getSettledSwapPreimage
