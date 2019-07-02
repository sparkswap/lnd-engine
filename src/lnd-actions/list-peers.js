const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of peers connected to the specified lnd instance
 *
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<{peers: Array}>}
 */
function listPeers ({ client }) {
  return new Promise((resolve, reject) => {
    client.listPeers({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listPeers
