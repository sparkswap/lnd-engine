const { subscribeSingleInvoice } = require('../lnd-actions')
const { INVOICE_STATES } = require('../constants')

class SettledSwapError extends Error {}
class CanceledSwapError extends Error {}

/**
 * Waits for a swap to enter the ACCEPTED state and errors if it won't happen
 *
 * @param {string} swapHash - hash for a swap
 * @returns {Promise<Date>} - creation date of the HTLC
 */
async function waitForSwapCommitment (swapHash) {
  return new Promise((resolve, reject) => {
    // we use an array for timers since an invoice can be
    // trigger the stream in an OPEN state multiple times.
    const timers = []

    // subscribeSingleInvoice always sends out the initial invoice state
    const stream = subscribeSingleInvoice(swapHash, { client: this.client })
    stream.on('end', () => {
      stream.removeAllListeners()
      reject(new Error('Stream ended while waiting for commitment on ' + swapHash))

      // stop the timers on invoice expiration if they are still active
      timers.forEach(clearTimeout)
    })
    stream.on('data', function (invoice) {
      switch (invoice.state) {
        case INVOICE_STATES.OPEN:
          const creationDate = new Date(invoice.creationDate * 1000)
          const expirationDate = new Date(
            creationDate.getTime() + (invoice.expiry * 1000)
          )

          // if the invoice is open but still expired, we consider it canceled
          if (new Date() > expirationDate) {
            reject(new CanceledSwapError(swapHash))
            stream.cancel()
            return
          }
          // once the invoice is expired, treat it as cancelled
          timers.push(setTimeout(() => {
            reject(new CanceledSwapError(swapHash))
            stream.cancel()
          }, expirationDate.getTime() - (new Date()).getTime()))
          break
        case INVOICE_STATES.SETTLED:
          reject(new SettledSwapError(swapHash))
          stream.cancel()
          break
        case INVOICE_STATES.CANCELED:
          reject(new CanceledSwapError(swapHash))
          stream.cancel()
          break
        case INVOICE_STATES.ACCEPTED:
          resolve(new Date(invoice.creationDate * 1000))
          stream.cancel()
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
