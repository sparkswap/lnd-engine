const { getInfo } = require('../lnd-actions')

/**
 * Returns the lnd instance's public key
 *
 * @returns {Promise<string>} identityPubkey
 */
async function getPublicKey () {
  const { identityPubkey } = await getInfo({ client: this.client })
  return identityPubkey
}

module.exports = getPublicKey
