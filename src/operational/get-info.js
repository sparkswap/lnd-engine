/**
 * Gets the Relayer's identity_pubkey from the LND api
 *
 * TODO: Might need to modify this call to except a parameter instead of grabbing
 * the relayer's payto
 * @returns {String} identityPubkey
 */
async function getInfo () {
  return new Promise((resolve, reject) => {
    this.lnd.getInfo({}, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getInfo
