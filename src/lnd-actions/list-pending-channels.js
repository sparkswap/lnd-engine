const { deadline } = require('../grpc-utils')

/**
 * Returns a list of pending channels
 * @see https://api.lightning.community/#pendingchannels
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Array>} channels
 */
function listPendingChannels ({ client }) {
  return new Promise((resolve, reject) => {
    client.pendingChannels({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listPendingChannels
