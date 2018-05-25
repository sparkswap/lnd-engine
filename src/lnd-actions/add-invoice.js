const { deadline } = require('../grpc-utils')

/**
 * Creates an invoice on lnd
 *
 * @function
 * @see {@link http://api.lightning.community/#addinvoice}
 * @param {String} [memo='']
 * @param {Int64} expiry invoice expiry in seconds
 * @param {Int64} value
 * @param {Object} opts
 * @param {grpc#client} opts.client
 * @returns {Promise<String>} rHash
 */
function addInvoice (memo, expiry, value, { client }) {
  const params = {
    memo,
    expiry,
    value
  }

  return new Promise((resolve, reject) => {
    client.addInvoice(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = addInvoice
