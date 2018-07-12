const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 *
 * @return {Big} totalBalance
 */
async function getTotalChannelBalance () {
  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('getTotalChannelBalance: No channels exist')
    return new Big(0).toString()
  }

  const totalLocalBalance = channels.reduce((acc, c) => {
    acc.add(new Big(c.localBalance))
  }, new Big(0))

  return totalLocalBalance
}

module.exports = getTotalChannelBalance
