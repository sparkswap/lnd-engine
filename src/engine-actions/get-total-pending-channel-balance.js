const { Big } = require('../utils')
const { listPendingChannels } = require('../lnd-actions')

/**
 * Get local balance of all pending channels for a specific daemon
 *
 * @returns {Promise<string>} totalBalance (int64)
 */
async function getTotalPendingChannelBalance () {
  const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })

  if (pendingOpenChannels.length === 0) {
    this.logger.debug(`getTotalPendingChannelBalance: No channels exist`, { symbol: this.symbol })
    return Big(0).toString()
  }

  const totalPendingLocalBalance = pendingOpenChannels.reduce((acc, c) => {
    return acc.plus(c.channel.localBalance)
  }, Big(0))

  return totalPendingLocalBalance.toString()
}

module.exports = getTotalPendingChannelBalance
