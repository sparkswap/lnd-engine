const fs = require('fs')

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
 * Recover wallet funds (on-chain and channel backups)
 *
 * @param {string} password - previous wallet password
 * @param {Array<string>} seed - 24 word cipher seed mnemonic
 * @param {boolean} useChannelBackup
 * @param {number} [recoveryWindow=RECOVERY_WINDOW_DEFAULT] - number in blocks for look back
 * @returns {Promise<void>} 24 word cipher seed mnemonic
 */
async function recoverWallet (password, seed, useChannelBackup, recoveryWindow = RECOVERY_WINDOW_DEFAULT) {
  if (!password) throw new Error('Password must be provided to recover wallet')
  if (!seed) throw new Error('Recovery seed must be provided to recover wallet')

  if (seed && !useChannelBackup) {
    this.logger.warn('Recovering wallet without a backup file. ONLY on-chain funds will be recovered')
  }

  let staticChannelBackup = null

  if (useChannelBackup) {
    staticChannelBackup = fs.readFileSync(this.currencyConfig.backupFilePath)
  }

  // Password must be converted to buffer in order for lnd to accept
  // as LND 0.7.0 does not accept String typed passwords
  const walletPassword = Buffer.from(password, 'utf8')

  // If the user has provided a seed, then we will try to recover the wallet
  // on creation
  await isValidSeed(seed)

  this.logger.debug(`Recovering wallet with recovery window: ${recoveryWindow}`)

  await initWallet(walletPassword, seed, { backup: staticChannelBackup, recoveryWindow, client: this.walletUnlocker })
}

module.exports = recoverWallet
