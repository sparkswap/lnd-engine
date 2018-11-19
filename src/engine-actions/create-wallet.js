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
  // We want to enforce LND's password requirements instead of making unneeded
  // calls to the engine. The only password requirement for LND is a password
  // longer than 8 characters in length
  if (password.length < 8) {
    throw new Error('Password length must be greater than 8 characters')
  }

  const { cipherSeedMnemonic } = await genSeed({ client: this.walletUnlocker })

  // Password must be converted to buffer in order for lnd to accept
  // as it does not accept String password types at this time.
  const walletPassword = Buffer.from(password, 'utf8')

  // This call merely resolves or rejects, there is no return value when the
  // wallet is initialized
  await initWallet(walletPassword, cipherSeedMnemonic, { client: this.walletUnlocker })

  return cipherSeedMnemonic
}

module.exports = createWallet
