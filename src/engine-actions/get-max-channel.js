const { Big } = require('../utils')
const { listChannels, listPendingChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 * @param {Boolean} [options.outbound=true] outbound is true if checking outbound channels, false if inbound
 * @return {Object} res
 * @return {String} res.maxBalance - the max balance in all open channels.
 */
async function getMaxChannel ({ outbound = true } = {}) {
  const [
    { channels = [] } = {},
    { pendingOpenChannels = [] } = {}
  ] = await Promise.all([
    // The response from listChannels consists of channels that may be active or inactive
    listChannels({ client: this.client }),
    listPendingChannels({ client: this.client })
  ])
  const balance = outbound ? 'localBalance' : 'remoteBalance'

  if (channels.length === 0 && pendingOpenChannels.length === 0) {
    this.logger.debug('getMaxChannel: No open or pending channels exist')
    return {}
  }

  const maxBalance = channels.reduce((max, channel) => {
    if (Big(channel[balance]).gt(max)) {
      return Big(channel[balance])
    } else {
      return max
    }
  }, Big('0'))

  const maxPendingBalance = pendingOpenChannels.reduce((max, pendingChannel) => {
    if (Big(pendingChannel.channel[balance]).gt(max)) {
      return Big(pendingChannel.channel[balance])
    } else {
      return max
    }
  }, Big('0'))

  const finalMaxBalance = maxBalance.gt(maxPendingBalance) ? maxBalance : maxPendingBalance

  return { maxBalance: finalMaxBalance.toString() }
}

module.exports = getMaxChannel
