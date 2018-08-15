const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 * @param {Boolean} [options.outbound=true] outbound is true if checking outbound channels, false if inbound
 * @return {Object} res
 * @return {String} res.maxBalance - the max balance in all open channels.
 */
async function getMaxChannel ({ outbound = true } = {}) {
  const { channels = [] } = await listChannels({ client: this.client })
  const balance = outbound ? 'localBalance' : 'remoteBalance'

  if (channels.length === 0) {
    this.logger.debug('getMaxChannel: No channels exist')
    return {}
  }

  const maxBalance = channels.reduce((max, channel) => Big(channel[balance]).gt(max) ? Big(channel[balance]) : max, Big(channels[0][balance]))
  return { maxBalance: maxBalance.toString() }
}

module.exports = getMaxChannel
