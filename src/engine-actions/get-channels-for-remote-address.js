const { networkAddressFormatter } = require('../utils')
const { listChannels, listPendingChannels } = require('../lnd-actions')

/**
 * Get all channels to the given address
 * @param {string} address
 * @returns {Promise<Array>} channels
 */
async function getChannelsForRemoteAddress (address) {
  const [
    { channels = [] },
    { pendingOpenChannels = [] }
  ] = await Promise.all([
    // The response from listChannels consists of channels that may be active or inactive
    listChannels({ client: this.client }),
    listPendingChannels({ client: this.client })
  ])

  const normalizedPendingChannels = pendingOpenChannels.map(chan => chan.channel)

  if (channels.length === 0 && normalizedPendingChannels.length === 0) {
    this.logger.debug('getChannelsForRemoteAddress: No channels exist')
    return []
  }

  const { publicKey } = networkAddressFormatter.parse(address)

  const channelsForPubkey = channels.filter(channel => channel.remotePubkey === publicKey)

  const pendingChannelsForPubkey = normalizedPendingChannels.filter(channel => channel.remoteNodePub === publicKey)

  return channelsForPubkey.concat(pendingChannelsForPubkey)
}

module.exports = getChannelsForRemoteAddress
