const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 *
 * @return {String} totalBalance (int64)
 */
async function getMaxChannel ({ outbound = true } = {}) {
  const { channels = [] } = await listChannels({ client: this.client })
  const balance = outbound ? 'localBalance' : 'remoteBalance'

  if (channels.length === 0) {
    this.logger.debug('getMaxChannel: No channels exist')
    return {}
  }

  const maxBalance = channels.reduce((max, channel) => Big(channel[balance]).gte(max) ? Big(channel[balance]) : max, Big(channels[0][balance]))
  return { maxBalance }
}

module.exports = getMaxChannel
