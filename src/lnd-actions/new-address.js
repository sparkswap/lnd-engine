const { deadline } = require('../grpc-utils')

/**
 * Returns a new wallet address from a lnd instance
 *
 * @see http://api.lightning.community/#newAddress
 * @param {number} type - Wallet Address Type
 * @param {Object} opts
 * @param {import('../lnd-setup').LndClient} opts.client
 * @returns {Promise<string>} address
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
