const { deadline } = require('../grpc-utils')

/**
 * Returns a list of pending channels
 * @external PendingChannelsResponse
 * @see {@link https://api.lightning.community/#pendingchannels}
 *
 * @param {grpc#client} opts.client
 *
 * @return {Promise<Array>} channels
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
