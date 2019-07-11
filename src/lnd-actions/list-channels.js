const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of open channels
 * @see https://api.lightning.community/#listchannels
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
 */
function listChannels ({ client }) {
  return new Promise((resolve, reject) => {
    client.listChannels({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listChannels
