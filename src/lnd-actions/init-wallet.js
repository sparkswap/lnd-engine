const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndWalletUnlockerClient} WalletUnlocker */

/**
 * Initializes an lnd wallet
 *
 * @see http://api.lightning.community/#initWallet
 * @param {Buffer} walletPassword - password in bytes
 * @param {Array} cipherSeedMnemonic - generated from lnd (24 string array)
 * @param {object} opts
 * @param {Buffer} [opts.backup] - binary lnd backup data
 * @param {number} [opts.recoveryWindow] - number of blocks for address lookback when restoring a wallet
 * @param {WalletUnlocker} opts.client
 * @returns {Promise<object>} res - empty object for success
 */
function initWallet (walletPassword, cipherSeedMnemonic, { backup, recoveryWindow, client }) {
  return new Promise((resolve, reject) => {
    let params = {
      walletPassword,
      cipherSeedMnemonic
    }

    if (backup) {
      params.backup = backup
    }

    if (recoveryWindow) {
      params.recoveryWindow = recoveryWindow
    }

    client.initWallet(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = initWallet
