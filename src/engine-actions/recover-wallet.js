const { initWallet } = require('../lnd-actions')

/**
 * Wallet recovery window number in blocks
 * @constant
 * @type {number}
 * @default
 */
const RECOVERY_WINDOW_DEFAULT = 5000

/**
 * @param {Array<string>} seed
 * @returns {Promise<boolean>}
 */
async function isValidSeed (seed) {
  if (!Array.isArray(seed)) return false
  if (seed.length !== 24) return false
  return true
}

/**
 * Creates a wallet
 *
 * @param {string} password - wallet password, used to unlock lnd wallet
 * @param {Array<string>} seed - 24 word cipher seed mnemonic
 * @param {Buffer} backup - Buffer of the LND static channel backup file
 * @param {?number} recoveryWindow - number in blocks for look back
 * @returns {Promise<Array<string>>} 24 word cipher seed mnemonic
 */
async function recoverWallet (password, seed, backup, recoveryWindow = null) {
  if (seed && !backup) {
    this.logger.warn('Recovering wallet without a backup file. ONLY on-chain funds will be recovered')
  }

  // The seed is required if the user is using a backup file
  if (!seed && backup) {
    throw new Error('Must provide seed when trying to restore wallet with backup file')
  }

  if (!seed) {
    throw new Error('No seed was provided. If you need to create a wallet, use `createWallet`')
  }

  // Password must be converted to buffer in order for lnd to accept
  // as it does not accept String password types at this time.
  const walletPassword = Buffer.from(password, 'utf8')

  // If the user has provided a seed, then we will try to recover the wallet
  // on creation
  await isValidSeed(seed)

  // If a recovery window was not provided, then we will use a default value
  recoveryWindow = recoveryWindow || RECOVERY_WINDOW_DEFAULT

  this.logger.debug(`Recovering wallet with recovery window: ${recoveryWindow}`)

  await initWallet(walletPassword, seed, { backup, recoveryWindow, client: this.walletUnlocker })

  return seed
}

module.exports = recoverWallet
