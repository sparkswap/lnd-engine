const { deadline } = require('../grpc-utils')

/**
 * Returns a list of completed payments
 *
 * @param {Object} opts
 * @param {grpc#client} opts.client
 */
function listPayments ({ client }) {
  return new Promise((resolve, reject) => {
    client.listPayments({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listPayments
