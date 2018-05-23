/**
 * Health
 * @module src/lnd-actions/health
 */

const { deadline } = require('../grpc-utils')

/**
 * Queries LND for a successful response
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
 */
function isOK () {
  return new Promise((resolve, reject) => {
    this.client.getInfo({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      return resolve(true)
    })
  })
}

module.exports = {
  isOK
}
