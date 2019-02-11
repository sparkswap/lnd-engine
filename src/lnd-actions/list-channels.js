const { deadline } = require('../grpc-utils')

/**
 * Returns a list of open channels
 * @external ListChannelsResponse
 * @see {@link https://api.lightning.community/#listchannels}
 *
 * @param {grpc#client} opts.client
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
