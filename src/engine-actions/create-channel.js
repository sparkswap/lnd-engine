const {
  connectPeer,
  openChannel
} = require('../lnd-actions')
const {
  networkAddressFormatter
} = require('../utils')

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} paymentChannelNetworkAddress
 * @param {String} fundingAmount - int64 string
 * @returns {Promise<void>} returns void on success
 */
async function createChannel (paymentChannelNetworkAddress, fundingAmount) {
  const { publicKey, host } = networkAddressFormatter.parse(paymentChannelNetworkAddress)

  // TODO check the funding defaults (usually 20000 satosh) and fail before contacting
  // LND
  this.logger.debug(`Attempting to create channel with ${host}`)

  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })

  this.logger.debug(`Successfully connected to peer: ${host}`)

  await openChannel(publicKey, fundingAmount, { client: this.client })

  this.logger.debug(`Successfully opened channel with: ${host}`)
}
module.exports = createChannel
