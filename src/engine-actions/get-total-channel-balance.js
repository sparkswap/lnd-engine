const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 *
 * @return {String} totalBalance (int64)
 */
async function getTotalChannelBalance () {
  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('getTotalChannelBalance: No channels exist')
    return Big(0).toString()
  }

  const totalLocalBalance = channels.reduce((acc, c) => {
    return acc.plus(c.localBalance)
  }, Big(0))

  return totalLocalBalance.toString()
}

module.exports = getTotalChannelBalance
