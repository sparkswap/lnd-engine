const { walletBalance } = require('../lnd-actions')

/**
 * Balance of unconfirmed unspent funds
 * @returns {string} total
 */
async function getUnconfirmedBalance () {
  const { unconfirmedBalance } = await walletBalance({ client: this.client })
  return unconfirmedBalance
}

module.exports = getUnconfirmedBalance
