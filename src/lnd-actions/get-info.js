const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Queries LND for its public key
 *
 * @see http://api.lightning.community/#getInfo
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
 */
function getInfo ({ client }) {
  return new Promise((resolve, reject) => {
    client.getInfo({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getInfo
