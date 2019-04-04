const { listPeers } = require('../lnd-actions')

/**
 * Gets all currently active peers connected to a specific engine
 *
 * @returns {Array<Object>} list of peers with pubkey, address and inbound flag
 */
async function getPeers () {
  const { peers = [] } = await listPeers({ client: this.client })

  return peers.map(peer => {
    return {
      pubKey: peer.pubKey,
      address: peer.address
    }
  })
}
module.exports = getPeers
