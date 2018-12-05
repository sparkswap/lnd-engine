const { deadline } = require('../grpc-utils')

/**
 * Returns a list of completed payments
 *
 * @function
 * @see {@link https://api.lightning.community/#listpayments}
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
