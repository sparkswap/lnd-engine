const { deadline } = require('../grpc-utils')

/**
 * Returns a list of invoices
 *
 * @param {Boolean} pendingOnly if true, returns only pending invoices
 * @param {Object} opts
 * @param {grpc#client} opts.client
 */
function listInvoices (pendingOnly, { client }) {
  return new Promise((resolve, reject) => {
    client.listInvoices({ pendingOnly }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      // TODO: Figure out if we should return less info
      return resolve(res)
    })
  })
}

module.exports = listInvoices
