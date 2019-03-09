const { Big } = require('../utils')
const getChannelsForAddress = require('./get-channels-for-address')

/**
 * Get local balance of all channels for a specific daemon
 * @param {string} address
 * @returns {Object} res
 * @returns {string} res.maxBalance - the max balance in all open channels.
 */
async function getMaxChannelForAddress (address) {
  const channelsForAddress = await getChannelsForAddress(address)

  if (!channelsForAddress.length) {
    this.logger.debug('getMaxChannelForAddress: No open or pending channels exist')
    return {}
  }

  const maxBalance = channelsForAddress.reduce((max, channel) => {
    if (Big(channel['localBalance']).gt(max)) {
      return Big(channel['localBalance'])
    } else {
      return max
    }
  }, Big('0'))

  this.logger.debug(`getMaxChannel: max open channel is: ${maxBalance.toString()}`)

  return { maxBalance: maxBalance.toString() }
}

module.exports = getMaxChannelForAddress
