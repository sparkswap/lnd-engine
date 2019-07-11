const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Returns a list of completed payments
 *
 * @see https://api.lightning.community/#listpayments
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<object>}
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
