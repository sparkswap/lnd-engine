const { listChannels } = require('../lnd-actions')
const { Big } = require('big.js')
/**
 * Returns a boolean, true if there is an active channel between caller and remote parties that sufficient funds for an order, false if not
 *
 * @param {string} destinationPublicKey - destinations public key
 * @param {Integer} minValue - minimum value that needs to be in the channel
 * @param {boolean} [options.outbound=true] outbound is true if checking outbound channels, false if inbound

 * @return {Promise<Boolean>} if a channel with sufficient funds exists
 */
async function isBalanceSufficient (destinationPublicKey, minValue, { outbound = true } = {}) {
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
