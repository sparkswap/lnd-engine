const { lookupInvoice } = require('../lnd-actions')
const { INVOICE_STATES } = require('../constants')

/**
 * Gets the preimage for a settled swap hash.
 *
 * @see {lnd-actions#lookupinvoice}
 * @see http://api.lightning.community/#addinvoice
 * @param {string} swapHash - Base64 encoded hash for the invoice
 * @returns {Promise<string>} Base64 encoded preimage for the hash
 * @throws {Error} If the invoice is not in a SETTLED state
 */
async function getSettledSwapPreimage (swapHash) {
  if (!swapHash) {
    throw new Error('Swap hash must be defined')
  }

  this.logger.debug('Looking up invoice by paymentHash:', { rHash: swapHash })

  const { state, rPreimage } = await lookupInvoice({ rHash: swapHash }, { client: this.client })

  this.logger.debug('Invoice has been retrieved: ', { state })

  if (state !== INVOICE_STATES.SETTLED) {
    throw new Error(`Cannot retrieve preimage from an invoice in a ${state} state.`)
  }

  return rPreimage
}

module.exports = getSettledSwapPreimage
