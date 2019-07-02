const { deadline } = require('../grpc-utils')

/** @typedef { import('../lnd-setup').LndWalletUnlockerClient } WalletUnlocker */

/**
 * Generates a mnuemonic seed used to recover a user's wallet
 *
 * @see http://api.lightning.community/#genSeed
 * @param {Object} opts
 * @param {WalletUnlocker} opts.client
 * @returns {Promise<Object>}
 */
function genSeed ({ client }) {
  return new Promise((resolve, reject) => {
    client.genSeed({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = genSeed
