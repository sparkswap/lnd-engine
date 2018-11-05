const { deadline } = require('../grpc-utils')

/**
 * Generates a mnuemonic seed used to recover a user's wallet
 *
 * @function
 * @see {@link http://api.lightning.community/#genSeed}
 * @return {Object} res
 * @return {Object} cipherSeedMnemonic
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
