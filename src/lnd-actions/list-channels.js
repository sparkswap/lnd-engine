const { deadline } = require('../grpc-utils')

/**
 * @external ListChannelsResponse
 * @see {@link https://api.lightning.community/#listchannels}
 */

/**
 * Returns a list of active channels
 *
 * @param {grpc#client} opts.client
 *
 * @return {Promise<external.ListChannelsResponse>} object with channels -> Array of channels
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
