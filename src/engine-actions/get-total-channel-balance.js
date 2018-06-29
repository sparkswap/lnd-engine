
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
  // const balances = {}

  const { channels = [] } = await listChannels({ client: this.client })

  const { pendingOpenChannels = [] } = await pendingChannels({ client: this.client })

  return { channels, pendingOpenChannels }
}

module.exports = getTotalChannelBalance
