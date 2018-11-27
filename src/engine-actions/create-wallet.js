const {
  genSeed,
  initWallet
} = require('../lnd-actions')

/**
 * Creates a wallet
 *
 * @param {String} password - wallet password, used to unlock lnd wallet
 * @return {Array<String>} cipher seed
 */
async function createWallet (password) {
  const { cipherSeedMnemonic } = await genSeed({ client: this.walletUnlocker })

  if (typeof password !== 'string') {
    throw new Error('Provided password must be a string value')
  }

  // Password must be converted to buffer in order for lnd to accept
  // as it does not accept String password types at this time.
  const walletPassword = Buffer.from(password, 'utf8')

  // This call merely resolves or rejects, there is no return value when the
  // wallet is initialized
  await initWallet(walletPassword, cipherSeedMnemonic, { client: this.walletUnlocker })

  return cipherSeedMnemonic
}

module.exports = createWallet
