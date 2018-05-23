/**
 * Info
 * @module src/lnd-actions/info
 */

/**
 * Queries LND for its public key
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
 */
function publicKey () {
  return new Promise((resolve, reject) => {
    this.client.getInfo({}, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      const { identityPubkey: pubKey } = res

      return resolve(pubKey)
    })
  })
}

module.exports = {
  publicKey
}
