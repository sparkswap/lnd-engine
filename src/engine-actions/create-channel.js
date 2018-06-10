const { connectPeer, openChannel } = require('../lnd-actions')

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} host
 * @param {String} publicKey - LN identity_publickey
 * @param {String} fundingAmount - int64 string
 */
async function createChannel (host, publicKey, fundingAmount) {
  // TODO check the funding defaults (usually 20000 satosh) and fail before contacting
  // LND
  this.logger.debug(`Attempting to create channel with ${host}`)
  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })
  this.logger.debug(`Successfully connected to peer: ${host}`)
  await openChannel(publicKey, fundingAmount, { client: this.client })
  this.logger.debug(`Successfully opened channel with: ${host}`)
  return true
}

module.exports = createChannel
