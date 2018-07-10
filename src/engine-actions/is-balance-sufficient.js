const { listChannels } = require('../lnd-actions')
const { Big, networkAddressFormatter } = require('../utils')

/**
 * Returns a boolean, true if there is an active channel between caller and remote
 * parties that sufficient funds for an order, false if they are not
 *
 * @param {string} destinationPublicKey - the destinations paymentChannelNetworkAddress
 * @param {Integer} minValue - minimum value that needs to be in the channel
 * @param {boolean} [options.outbound=true] outbound is true if checking outbound channels, false if inbound

 * @return {Promise<Boolean>} if a channel with sufficient funds exists
 */
async function isBalanceSufficient (paymentChannelNetworkAddress, minValue, { outbound = true } = {}) {
  const destinationPublicKey = networkAddressFormatter.parse(paymentChannelNetworkAddress)
  const balance = outbound ? 'localBalance' : 'remoteBalance'

  const { channels } = await listChannels({ client: this.client })

  if (!channels || (channels && channels.length === 0)) {
    this.logger.debug('No channels are available', { destinationPublicKey })
    return false
  }

  const activeChannels = channels.filter(c => c.active)

  if (activeChannels.length === 0) {
    this.logger.debug('No active channels are available', { destinationPublicKey })
    return false
  }

  const activeChannelsFromDestination = activeChannels.filter(ac => ac.remotePubkey === destinationPublicKey)
  return activeChannelsFromDestination.some(channel => Big(channel[balance]).gte(minValue))
}

module.exports = isBalanceSufficient
