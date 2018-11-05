const {
  genSeed,
  initWallet
} = require('../lnd-actions')

/**
 *
 */
async function createWallet () {
  const { cipherSeedMnemonic } = await genSeed({ client: this.walletUnlocker })

  // Generate a password here
  // Then make it a buffer
  const walletPassword = Buffer.from('sparkswap', 'utf8')

  return initWallet(walletPassword, cipherSeedMnemonic)
}

module.exports = createWallet
