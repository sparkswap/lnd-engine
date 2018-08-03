const { walletBalance, listPendingChannels } = require('../lnd-actions')
const { Big } = require('../utils')

/**
 * Total balance of unspent funds
 * @returns {String} total
 */
async function getUncommittedPendingBalance () {
  const { unconfirmedBalance } = await walletBalance({ client: this.client })
  const { pendingClosingChannels = [], pendingForceClosingChannels = [], waitingCloseChannels = [] } = await listPendingChannels({ client: this.client })

  if (pendingClosingChannels.length === 0 && pendingForceClosingChannels.length === 0 && waitingCloseChannels.length === 0) {
    this.logger.debug('getUncommittedPendingBalance: No channels exist')
    return Big(unconfirmedBalance).toString()
  }

  const allPendingChannels = pendingClosingChannels.concat(pendingForceClosingChannels).concat(waitingCloseChannels)
  const totalPendingLocalBalance = allPendingChannels.reduce((acc, c) => {
    return acc.plus(c.channel.localBalance)
  }, Big(0))

  return Big(unconfirmedBalance).add(totalPendingLocalBalance).toString()
}

module.exports = getUncommittedPendingBalance
