/**
 * Balance
 * @module src/lnd-actions/balance
 */

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @function
 * @see {@link http://api.lightning.community/#walletBalance}
 * @return {Promise}
 */
function walletBalance () {
  return new Promise((resolve, reject) => {
    this.client.walletBalance({}, (err, response) => {
      if (err) return reject(err)
      return resolve(response)
    })
  })
}

async function total () {
  const { total } = await walletBalance()
  return total
}

async function uncommitted () {
  const { uncommitted } = await walletBalance()
  return uncommitted
}

async function committed () {
  const { committed } = await walletBalance()
  return committed
}

module.exports = {
  total,
  uncommitted,
  committed
}
