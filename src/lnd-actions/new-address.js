const { deadline } = require('../grpc-utils')

/**
 * Returns a new wallet address from a lnd instance
 *
 * @function
 * @see {@link http://api.lightning.community/#newAddress}
 * @return {String} address
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
