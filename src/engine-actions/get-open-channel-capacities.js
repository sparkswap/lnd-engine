const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get local balance of all channels for a specific daemon
 *
 * @returns {Promise<object>} active and inactive balances
 */
async function getOpenChannelCapacities () {
  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('getOpenChannelCapacities: No channels exist')
  }

  const activeLocalBalance = channels.filter((chan) => chan.active === true).reduce((acc, c) => {
    return acc.plus(c.localBalance)
  }, Big(0))

  const activeRemoteBalance = channels.filter((chan) => chan.active === true).reduce((acc, c) => {
    return acc.plus(c.remoteBalance)
  }, Big(0))

  const activeBalances = { localBalance: activeLocalBalance.toString(), remoteBalance: activeRemoteBalance.toString() }

  const inactiveLocalBalance = channels.filter((chan) => chan.active === false).reduce((acc, c) => {
    return acc.plus(c.localBalance)
  }, Big(0))

  const inactiveRemoteBalance = channels.filter((chan) => chan.active === false).reduce((acc, c) => {
    return acc.plus(c.remoteBalance)
  }, Big(0))

  const inactiveBalances = { localBalance: inactiveLocalBalance.toString(), remoteBalance: inactiveRemoteBalance.toString() }

  return { active: activeBalances, inactive: inactiveBalances }
}

module.exports = getOpenChannelCapacities
