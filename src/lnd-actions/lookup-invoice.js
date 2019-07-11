const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Check's an invoice status
 *
 * @see http://api.lightning.community/#lookupInvoice
 * @param {object} paymentHashObj
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
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
