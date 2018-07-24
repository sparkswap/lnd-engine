const {
  lookupInvoice,
  subscribeInvoices
} = require('../lnd-actions')

/**
 * Gets the preimage for a settled swap hash. If the swap has not yet settled,
 * it will wait for the settlement before returning to the caller
 *
 * @see {lnd-actions#lookupinvoice}
 * @see {@link http://api.lightning.community/#addinvoice}
 * @see {lnd-actions#subscribeInvoices}
 * @param {String} swapHash
 * @returns {Boolean} true if the invoice is settled, false if not
 */
function getSettledSwapPreimage (swapHash) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentHash

      if (!swapHash) {
        throw new Error('Swaphash must be defined')
      }

      // We convert the swapHash from base64 string to hex because lookupInvoice takes in a hex
      // encoded rhash as an argument.
      paymentHash = Buffer.from(swapHash, 'base64').toString('hex')
      // Before subscribing to invoices we lookup to see if it has already been settled,
      // if so, we can return immediately to the caller
      const { settled, rPreimage } = await lookupInvoice(paymentHash, { client: this.client })

      if (settled) {
        return resolve(rPreimage)
      }

      const subscription = subscribeInvoices({ client: this.client })

      const errorListener = (err) => {
        this.logger.error(`Error from subscribeInvoices stream`, err)
        return finish(err)
      }

      const endListener = () => {
        this.logger.error(`LND closed subscribeInvoices stream before returning our value`)
        return finish(new Error(`LND closed stream to retrieve invoice`))
      }

      const dataListener = (response) => {
        const { memo, rHash, settled, settleDate, rPreimage } = response
        this.logger.debug('Received invoice subscription from LND', { memo, rHash, settled })
        if (rHash === swapHash) {
          this.logger.debug(`Invoice subscription matched our observed swapHash`, { swapHash, memo })

          if (settled) {
            this.logger.debug(`Invoice is settled as of ${settleDate}`)
            return finish(null, rPreimage)
          }
        }
      }

      // Helper to make sure we tear down our listeners
      const finish = (err, response) => {
        subscription.removeListener('error', errorListener)
        subscription.removeListener('end', endListener)
        subscription.removeListener('data', dataListener)

        if (err) {
          return reject(err)
        }

        resolve(response)
      }

      subscription.on('error', errorListener)
      subscription.on('end', endListener)
      subscription.on('data', dataListener)
    } catch (e) {
      return reject(e)
    }
  })
}

module.exports = getSettledSwapPreimage
