const { Big } = require('../utils')
const getChannelsForRemoteAddress = require('./get-channels-for-remote-address')

/**
 * Get maximum balance from all channels (inbound or outbound) for a given address
 * @param {string} address
 * @param {object} [options={}]
 * @param {boolean} [options.outbound=true] - outbound is true if checking outbound channels, false if inbound
 * @returns {Promise<{maxBalance: string}>} - the max balance in all open channels.
 */
async function getMaxChannelForAddress (address, { outbound = true } = {}) {
  const channelsForAddress = await getChannelsForRemoteAddress.call(this, address)

  if (!channelsForAddress.length) {
    this.logger.debug('getMaxChannelForAddress: No open or pending channels exist')
    return { maxBalance: '0' }
  }

  const balanceType = outbound ? 'localBalance' : 'remoteBalance'

  const maxBalance = channelsForAddress.reduce((max, channel) => {
    if (Big(channel[balanceType]).gt(max)) {
      return Big(channel[balanceType])
    } else {
      return max
    }
  }, Big('0'))

  this.logger.debug(`getMaxChannelForAddress: max open channel to address is: ${maxBalance.toString()}`)

  return { maxBalance: maxBalance.toString() }
}

module.exports = getMaxChannelForAddress
