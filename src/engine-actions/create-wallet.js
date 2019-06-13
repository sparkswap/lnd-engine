const {
  genSeed,
  initWallet
} = require('../lnd-actions')

/**
 * Wallet recovery window number in blocks
 * @constant
 * @type {number}
 * @default
 */
const RECOVERY_WINDOW_DEFAULT = 5000

/**
 * @param {Array<string>} seed
 * @returns {boolean}
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
 * @param {Object} opts
 * @param {Array<string>} opts.seed - 24 word cipher seed mnemonic
 * @param {Buffer} opts.backup - binary string of an lnd backup file
 * @returns {Array<string>} 24 word cipher seed mnemonic
 */
async function createWallet (password, { seed, backup, recoveryWindow = undefined } = {}) {
  if (!seed && backup) {
    throw new Error('Must provide seed when trying to restore wallet')
  }

  // Password must be converted to buffer in order for lnd to accept
  // as it does not accept String password types at this time.
  const walletPassword = Buffer.from(password, 'utf8')

  // If the user has provided a seed, then we will try to recover the wallet
  // on creation
  if (seed) {
    await isValidSeed(seed)

    // If a recovery window was not provided, then we will use a default value
    recoveryWindow = recoveryWindow || RECOVERY_WINDOW_DEFAULT

    await initWallet(walletPassword, seed, { backup, recoveryWindow, client: this.walletUnlocker })
    return seed
  }

  const { cipherSeedMnemonic } = await genSeed({ client: this.walletUnlocker })

  // backup will be undefined here if we are simply creating a wallet
  await initWallet(walletPassword, cipherSeedMnemonic, { client: this.walletUnlocker })

  return cipherSeedMnemonic
}

module.exports = createWallet
