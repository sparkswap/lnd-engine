/**
 * Get Info
 * @module src/lnd-actions/get-info
 */

/**
 * Gets the Relayer's identity_pubkey from the LND api
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
 */
function getInfo () {
  return new Promise((resolve, reject) => {
    this.client.getInfo({}, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getInfo
