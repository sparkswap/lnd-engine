const { Big } = require('../utils')
const { listChannels, listPendingChannels } = require('../lnd-actions')

/**
 * Get maximum balance from all channels (inbound or outbound)
 * @param {Object} [options={}]
 * @param {boolean} [options.outbound=true] - outbound is true if checking outbound channels, false if inbound
 * @returns {Object} res
 * @returns {string} res.maxBalance - the max balance in all open channels.
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
  const balanceType = outbound ? 'localBalance' : 'remoteBalance'

  if (!channels.length && !pendingOpenChannels.length) {
    this.logger.debug('getMaxChannel: No open or pending channels exist')
    return {}
  }

  // We need to normalize pendingChannels here because their format is different
  // than those received from `listChannels`
  const pendingChannels = pendingOpenChannels.map(chan => chan.channel)

  const allChannels = channels.concat(pendingChannels)

  const maxBalance = allChannels.reduce((max, channel) => {
    if (Big(channel[balanceType]).gt(max)) {
      return Big(channel[balanceType])
    } else {
      return max
    }
  }, Big('0'))

  this.logger.debug(`getMaxChannel: max open channel is: ${maxBalance.toString()}`)

  return { maxBalance: maxBalance.toString() }
}

module.exports = getMaxChannel
