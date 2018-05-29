const { deadline } = require('../grpc-utils')

/**
 * Returns a list of channels that are connected to host
 *
 * @param {grpc#client} opts.client
 * @return {Promise<Array>}
 */
function listChannels ({ client }) {
  return new Promise((resolve, reject) => {
    client.listInvoices({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listChannels
