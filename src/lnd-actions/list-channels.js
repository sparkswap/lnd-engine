const { deadline } = require('../grpc-utils')

/**
 * Returns a list of invoices
 *
 * @param {Boolean} pendingOnly if true, returns only pending invoices
 * @param {Object} opts
 * @param {grpc#client} opts.client
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
