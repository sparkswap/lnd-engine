const { Big } = require('../utils')
const getChannelsForRemoteAddress = require('./get-channels-for-remote-address')

/**
 * Get local balance of all channels for a specific address
 * @param {string} address
 * @returns {string} totalBalance (int64)
 */
async function getTotalBalanceForAddress (address) {
  const channelsForAddress = await getChannelsForRemoteAddress.call(this, address)

  if (channelsForAddress.length === 0) {
    this.logger.debug('getTotalBalanceForAddress: No open or pending channels exist', { symbol: this.symbol, address })
    return Big(0).toString()
  }

  const totalLocalBalance = channelsForAddress.reduce((acc, c) => {
    return acc.plus(c.localBalance)
  }, Big(0))

  return totalLocalBalance.toString()
}

module.exports = getTotalBalanceForAddress
