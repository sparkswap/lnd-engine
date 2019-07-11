const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @see http://api.lightning.community/#walletBalance
 * @param {object} opts
 * @param {LndClient} opts.client
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
