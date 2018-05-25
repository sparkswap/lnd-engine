const { deadline } = require('../grpc-utils')

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @function
 * @see {@link http://api.lightning.community/#walletBalance}
 * @return {Promise}
 */
function walletBalance ({ client }) {
  return new Promise((resolve, reject) => {
    client.walletBalance({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = walletBalance
