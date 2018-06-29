
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

  if (channels.length === 0 || pendingOpenChannels.length === 0) {
    this.logger.debug('getTotalChannelBalance: No channels exist')
    return balances
  }

  console.log('made it here')
  const activeChannelsForPubkey = channels.filter(channel => channel.remotePubkey === remotePubKey)
  console.log(activeChannelsForPubkey)
  const amountInActiveChannels = activeChannelsForPubkey.reduce((acc, chan) => (acc += chan.remoteBalance))
  console.log(amountInActiveChannels)
  balances['active'] = amountInActiveChannels
  console.log('balances', balances)
  const pendingChannelsForPubkey = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === remotePubKey)
  console.log(pendingChannelsForPubkey)
  const amountInPendingChannels = pendingChannelsForPubkey.reduce((acc, chan) => (acc += chan.remoteBalance))
  console.log(amountInPendingChannels)
  balances['pending'] = amountInPendingChannels
  console.log('balances', balances)
  balances['pending'] = amountInPendingChannels
  console.log('balances with pending', balances)

  return balances
}

module.exports = getTotalChannelBalance
