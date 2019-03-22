const { walletBalance, listPendingChannels } = require('../lnd-actions')
const { Big } = require('../utils')

/**
 * Total balance of unspent funds
 * @returns {string} total
 */
async function getUncommittedPendingBalance () {
  const { unconfirmedBalance } = await walletBalance({ client: this.client })
  const { pendingForceClosingChannels = [] } = await listPendingChannels({ client: this.client })

  if (!pendingForceClosingChannels.length) {
    this.logger.debug('getUncommittedPendingBalance: No pendingForceClosingChannels exist')
    return Big(unconfirmedBalance).toString()
  }

  const totalPendingLocalBalance = pendingForceClosingChannels.reduce((acc, c) => {
    return acc.plus(c.channel.localBalance)
  }, Big(0))

  return Big(unconfirmedBalance).add(totalPendingLocalBalance).toString()
}

module.exports = getUncommittedPendingBalance
