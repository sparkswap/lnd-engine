const { deadline } = require('../grpc-utils')

/**
 * Returns a list of closed channels
 * @external ClosedChannelsResponse
 * @see {@link https://api.lightning.community/#closedchannels}
 *
 * @param {grpc#client} opts.client
 * @return {Promise<external.ClosedChannelsResponse>} object with channels -> Array of channels
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
