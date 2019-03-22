const { deadline } = require('../grpc-utils')

/**
 * Returns a new wallet address from a lnd instance
 *
 * @see http://api.lightning.community/#newAddress
 * @param {string} type - Wallet Address Type
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {string} address
 */
function newAddress (type, { client }) {
  return new Promise((resolve, reject) => {
    client.newAddress({ type }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      const { address } = res
      return resolve(address)
    })
  })
}

module.exports = newAddress
