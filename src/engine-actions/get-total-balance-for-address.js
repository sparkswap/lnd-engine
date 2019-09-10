const { Big } = require('../utils')
const getChannelsForRemoteAddress = require('./get-channels-for-remote-address')

/**
 * Get local balance of all channels for a specific address
 * @param {string} address
 * @param {object} [options={}]
 * @param {boolean} [options.outbound=true] - outbound is true if checking outbound channels, false if inbound
 * @returns {Promise<string>} totalBalance (int64)
 */
async function getTotalBalanceForAddress (address, { outbound = true } = {}) {
  const channelsForAddress = await getChannelsForRemoteAddress.call(this, address)

  const balanceType = outbound ? 'localBalance' : 'remoteBalance'
  const totalBalance = channelsForAddress.reduce((acc, c) => {
    return acc.plus(c[balanceType])
  }, Big(0))

  return totalBalance.toString()
}

module.exports = getTotalBalanceForAddress
