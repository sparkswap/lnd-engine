const { deadline } = require('../grpc-utils')

/**
 * Initializes an lnd wallet
 *
 * @see http://api.lightning.community/#initWallet
 * @param {Buffer} walletPassword - password in bytes
 * @param {Array} cipherSeedMnemonic - generated from lnd (24 string array)
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>} res - empty object for success
 */
function initWallet (walletPassword, cipherSeedMnemonic, { client }) {
  return new Promise((resolve, reject) => {
    client.initWallet({ walletPassword, cipherSeedMnemonic }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = initWallet
