const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of closed channels
 * @see https://api.lightning.community/#closedchannels
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<{channels: Array}>}
 */
function listClosedChannels ({ client }) {
  return new Promise((resolve, reject) => {
    client.closedChannels({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listClosedChannels
