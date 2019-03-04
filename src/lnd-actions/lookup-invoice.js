const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @see http://api.lightning.community/#lookupInvoice
 * @param {string} paymentHash
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function lookupInvoice (paymentHash, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupInvoice({ rHashStr: paymentHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = lookupInvoice
