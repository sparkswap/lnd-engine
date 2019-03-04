const { walletBalance } = require('../lnd-actions')

/**
 * Total balance of unspent funds
 * @returns {string} total
 */
async function getUncommittedBalance () {
  const { confirmedBalance } = await walletBalance({ client: this.client })
  return confirmedBalance
}

module.exports = getUncommittedBalance
