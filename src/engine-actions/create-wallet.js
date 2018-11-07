const {
  genSeed,
  initWallet
} = require('../lnd-actions')

/**
 * Creates a wallet
 *
 * @param {String} password - wallet password, used to unlock lnd wallet
 * @return {void}
 */
async function createWallet (password) {
  const { cipherSeedMnemonic } = await genSeed({ client: this.walletUnlocker })

  if (typeof password !== 'string') {
    throw new Error('Provided password must be a string value')
  }

  // Password must be converted to buffer in order for lnd to accept
  // as it does not accept String password types at this time.
  const walletPassword = Buffer.from(password, 'utf8')

  return initWallet(walletPassword, cipherSeedMnemonic)
}

module.exports = createWallet
