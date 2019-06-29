const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @see http://api.lightning.community/#lookupInvoice
 * @param {Object} paymentHashObj
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function lookupInvoice (paymentHashObj, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupInvoice(paymentHashObj, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = lookupInvoice
