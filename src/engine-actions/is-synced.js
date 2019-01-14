const { getInfo } = require('../lnd-actions')

/**
 * Returns the lnd instance's public key
 *
 * @function
 * @return {String} identityPubkey
 */
async function isSynced () {
  const { syncedToChain } = await getInfo({ client: this.client })
  return syncedToChain
}

module.exports = isSynced
