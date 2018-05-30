const { listPeers } = require('../lnd-actions')

/**
 * Gets all connected peers for a specified lnd instance
 *
 * @return {Array} peers
 */
async function getPeers () {
  const { peers } = await listPeers({ client: this.client })
  return peers
}

module.exports = getPeers
