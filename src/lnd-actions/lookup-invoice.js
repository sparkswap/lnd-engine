const { deadline } = require('../grpc-utils')

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#lookupInvoice}
 * @param {String} rHash - invoice request hash
 * @return {Object} response
 */
function lookupInvoice (rHash, { client }) {
  return new Promise((resolve, reject) => {
    client.lookupInvoice({ rHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      // TODO: Figure out what fields to return
      return resolve(res)
    })
  })
}

module.exports = lookupInvoice
