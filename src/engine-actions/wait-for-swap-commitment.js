const { subscribeSingleInvoice } = require('../lnd-actions')
const { INVOICE_STATES } = require('../constants')

class SettledSwapError extends Error {}
class CanceledSwapError extends Error {}

/**
 * Waits for a swap to enter the ACCEPTED state and errors if it won't happen
 *
 * @param {Bytes} swapHash - hash for a swap
 * @returns {Date} - creation date of the HTLC
 */
async function waitForSwapCommitment (swapHash) {
  return new Promise((resolve, reject) => {
    // subscribeSingleInvoice always sends out the initial invoice state
    const stream = subscribeSingleInvoice(swapHash, { client: this.client })
    stream.on('end', () => reject(new Error(
      'Stream ended while waiting for commitment on ' + swapHash)))
    stream.on('data', function (invoice) {
      switch (invoice.state) {
        case INVOICE_STATES.OPEN:
          break
        case INVOICE_STATES.SETTLED:
          stream.removeAllListeners()
          reject(new SettledSwapError(swapHash))
          break
        case INVOICE_STATES.CANCELED:
          stream.removeAllListeners()
          reject(new CanceledSwapError(swapHash))
          break
        case INVOICE_STATES.ACCEPTED:
          stream.removeAllListeners()
          resolve(new Date(invoice.creationDate * 1000))
          break
      }
    })
  })
}

module.exports = {
  waitForSwapCommitment,
  SettledSwapError,
  CanceledSwapError
}
