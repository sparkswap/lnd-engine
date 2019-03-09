const { Big } = require('../utils')
const getChannelsForAddress = require('./get-channels-for-address')

/**
 * Get local balance of all channels for a specific daemon
 * @param {string} address
 * @param {Object} [options={}]
 * @param {boolean} [options.outbound=true] - outbound is true if checking outbound channels, false if inbound
 * @returns {Object} res
 * @returns {string} res.maxBalance - the max balance in all open channels.
 */
async function getMaxChannelForAddress (address, { outbound = true } = {}) {
  const channelsForAddress = await getChannelsForAddress(address)

  if (!channelsForAddress.length) {
    this.logger.debug('getMaxChannelForAddress: No open or pending channels exist')
    return {}
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
