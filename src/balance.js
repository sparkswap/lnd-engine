
/**
 * Returns all balance types
 * @returns {String} total
 */
async function getBalances () {
  return walletBalance.call(this)
}

/**
 * Total balance of unspent funds
 * @returns {String} total
 */
async function getTotalBalance () {
  const { totalBalance } = await walletBalance.call(this)
  return totalBalance
}

/**
 * Balance of unconfirmed unspent funds
 * @returns {String} total
 */
async function getUnconfirmedBalance () {
  const { unconfirmedBalance } = await walletBalance.call(this)
  return unconfirmedBalance
}

/**
 * Balance of confirmed unspent funds
 * @returns {String} total
 */
async function getConfirmedBalance () {
  const { confirmedBalance } = await walletBalance.call(this)
  return confirmedBalance
}

module.exports = {
  getBalances,
  getTotalBalance,
  getUnconfirmedBalance,
  getConfirmedBalance,
  getUncommittedBalance: getConfirmedBalance,
  getCommittedBalance: getUnconfirmedBalance
}
