const { connectPeer, openChannel } = require('./lnd-actions')

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} host
 * @param {String} publicKey - LN identity_publickey
 * @param {String} fundingAmount - int64 string
 */
async function createChannel (host, publicKey, fundingAmount) {
  await connectPeer(publicKey, host, { client: this.client })
  await openChannel(publicKey, fundingAmount)
  return true
}

module.exports = createChannel
