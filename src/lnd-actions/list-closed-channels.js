const { deadline } = require('../grpc-utils')

/**
 * Returns a list of closed channels
 * @see https://api.lightning.community/#closedchannels
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
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
