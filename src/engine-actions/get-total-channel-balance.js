
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

  console.log('channels are', channels)
  console.log('pendingOpenChannels are', pendingOpenChannels)

  if (channels.length === 0 && pendingOpenChannels.length === 0) {
    this.logger.debug('getTotalChannelBalance: No channels exist')
    return balances
  }

  console.log('made it here')
  balances['active'] = channels.filter(channel => channel.remotePubkey === remotePubKey)
    .reduce((acc, chan) => (acc += chan.remoteBalance))
  console.log('balances', balances)
  balances['pending'] = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === remotePubKey)
    .reduce((acc, chan) => (acc += chan.channel.remoteBalance))
  console.log('balances with pending', balances)

  return balances
}

module.exports = getTotalChannelBalance
