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

  /**
   * When closing a channel, we were getting a duplicated pending unconfirmed balance.
   * This is because unconfirmedBalance for the wallet and waitingCloseChannels from listChannels contain the same information.
   * We do not need waitingCloseChannels for this reason, and we remove pendingClosingChannels because
   * it is deprecated (https://github.com/lightningnetwork/lnd/blob/15c9b389fa097b6beb0b0e8f24ba78a9d1254693/rpcserver.go#L2167).
   */
  const totalPendingLocalBalance = pendingForceClosingChannels.reduce((acc, c) => {
    return acc.plus(c.channel.localBalance)
  }, Big(0))

  return Big(unconfirmedBalance).add(totalPendingLocalBalance).toString()
}

module.exports = getUncommittedPendingBalance
