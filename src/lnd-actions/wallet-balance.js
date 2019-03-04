const { deadline } = require('../grpc-utils')

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @see http://api.lightning.community/#walletBalance
 * @param {Object} args
 * @param {LndClient} args.client
 * @returns {Promise}
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
