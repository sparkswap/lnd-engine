const { listChannels, listPendingChannels } = require('../lnd-actions')

/**
 * Returns a number of channels that have the remotePubkey
 *
 * @return {Promise}
 */
async function numChannelsForPubkey (pubkey) {
  const { channels } = listChannels({ client: this.client })
  const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })

  if (channels.length === 0 && pendingOpenChannels.length === 0) {
    this.logger.debug('numChannelsForPubkey: No channels exist')
  }
  const channelsForPubkey = channels.filter(channel => channel.remotePubkey === pubkey)
  const pendingChannelsForPubkey = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === pubkey)
  return channelsForPubkey.length + pendingChannelsForPubkey.length
}

module.exports = numChannelsForPubkey
