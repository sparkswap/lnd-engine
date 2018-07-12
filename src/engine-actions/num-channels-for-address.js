const { listChannels, listPendingChannels } = require('../lnd-actions')
const { networkAddressFormatter } = require('../utils')
/**
 * Returns a number of channels that have the remotePubkey
 * @param {String} paymentChannelNetworkAddress
 * @return {number} number of active and pending channels
 */
async function numChannelsForAddress (address) {
  const { channels = [] } = listChannels({ client: this.client })
  const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })

  if (channels.length === 0 && pendingOpenChannels.length === 0) {
    this.logger.debug('numChannelsForAddress: No channels exist')
  }

  const { publicKey } = networkAddressFormatter.parse(address)
  const channelsForPubkey = channels.filter(channel => channel.remotePubkey === publicKey)
  const pendingChannelsForPubkey = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === publicKey)
  return channelsForPubkey.length + pendingChannelsForPubkey.length
}

module.exports = numChannelsForAddress
