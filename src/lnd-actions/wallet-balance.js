/**
 * Balance
 * @module src/lnd-actions/balance
 */

const { deadline } = require('../grpc-utils')

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @function
 * @see {@link http://api.lightning.community/#walletBalance}
 * @return {Promise}
 */
function walletBalance () {
  return new Promise((resolve, reject) => {
    this.client.walletBalance({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.log('Received response from lnd: ', res)

      return resolve(res)
    })
  })
}

module.exports = walletBalance
