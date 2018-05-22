/**
 * Health
 * @module src/lnd-actions/health
 */

/**
 * Queries LND for a successful response
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
 */
function isOK () {
  return new Promise((resolve, reject) => {
    this.client.getInfo({}, (err, res) => {
      if (err) return reject(err)

      this.logger.log('Received response from lnd: ', res)

      return resolve(true)
    })
  })
}

module.exports = {
  isOK
}
