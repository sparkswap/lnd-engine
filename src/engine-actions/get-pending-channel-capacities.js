const { Big } = require('../utils')
const { listPendingChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 *
 * @return {String} totalBalance (int64)
 */
async function getPendingChannelCapacities () {
  const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })

  if (pendingOpenChannels.length === 0) {
    this.logger.debug('getPendingChannelCapacities: No channels exist')
  }

  const totalLocalBalance = pendingOpenChannels.reduce((acc, c) => {
    return acc.plus(c.channel.localBalance)
  }, Big(0))

  const totalRemoteBalance = pendingOpenChannels.reduce((acc, c) => {
    return acc.plus(c.channel.remoteBalance)
  }, Big(0))

  return { localBalance: totalLocalBalance.toString(), remoteBalance: totalRemoteBalance.toString() }
}

module.exports = getPendingChannelCapacities
