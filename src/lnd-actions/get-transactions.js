const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of all on-chain transactions for the engine
 *
 * @see http://api.lightning.community/#getTransactions
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<{transactions: Array}>} response
 */
function getTransactions ({ client }) {
  return new Promise((resolve, reject) => {
    client.getTransactions({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getTransactions
