
const {
  listChannels,
  pendingChannels
} = require('../lnd-actions')

/**
 * Get committed balance of all channels
 *
 * @return {Array<Symbol, Big>}
 */
async function getTotalChannelBalance (remotePubKey) {
  const balances = {}

  const { channels = [] } = await listChannels({ client: this.client })

  const { pendingOpenChannels = [] } = await pendingChannels({ client: this.client })

  if (channels.length === 0 || pendingOpenChannels.length === 0) {
    this.logger.debug('getTotalChannelBalance: No channels exist')
    return balances
  }

  balances['active'] = channels.filter(channel => channel.remotePubkey === remotePubKey)
    .reduce((acc, chan) => (acc += chan.remoteBalance))
  balances['pending'] = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === remotePubKey)
    .reduce((acc, chan) => (acc += chan.channel.remoteBalance))

  return balances
}

module.exports = getTotalChannelBalance
