
const {
  listChannels,
  pendingChannels
} = require('../lnd-actions')

const { Big } = require('../utils')

/**
 * Get committed balance of all channels
 *
 * @return {Object.<active, pending>} values are total balances in active and pending channels
 */
async function getTotalChannelBalance (remotePubKey) {
  const { channels = [] } = await listChannels({ client: this.client })

  const { pendingOpenChannels = [] } = await pendingChannels({ client: this.client })

  const balances = {
    active: new Big(0),
    pending: new Big(0)
  }

  if (channels.length === 0 && pendingOpenChannels.length === 0) {
    throw new Error('getTotalChannelBalance: No channels exist')
  }

  const activeChannelsForPubkey = channels.filter(channel => channel.remotePubkey === remotePubKey)
  for (const { remoteBalance } of activeChannelsForPubkey) {
    const balance = new Big(remoteBalance)
    balances['active'] = balances['active'].add(balance)
  }

  const pendingChannelsForPubkey = pendingOpenChannels.filter(channel => channel.channel.remoteNodePub === remotePubKey)
  console.log('PENDING CHANNELS', pendingChannelsForPubkey)
  for (const { channel: { remoteBalance } } of pendingChannelsForPubkey) {
    const balance = new Big(remoteBalance)
    balances['pending'] = balances['pending'].add(balance)
  }

  return { activeBalance: balances['active'].toString(), pendingBalance: balances['pending'].toString() }
}

module.exports = getTotalChannelBalance
