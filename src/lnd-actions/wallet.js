/**
 * Wallet
 * @module src/lnd-actions/wallet
 */

const { deadline } = require('../grpc-utils')

/**
 * Segregated Witness address type. Referred to as nested-pay-to-witness-key-hash (np2wkh)
 *
 * @constant
 * @type {String}
 * @default
 */
const DEFAULT_ADDRESS_TYPE = 0 // np2wkh

/**
 * Returns a new wallet address from a lnd instance
 *
 * @function
 * @see {@link http://api.lightning.community/#newAddress}
 * @return {String} address
 */
function newAddress () {
  return new Promise((resolve, reject) => {
    this.client.newAddress({ type: DEFAULT_ADDRESS_TYPE }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      const { address } = res

      return resolve(address)
    })
  })
}

module.exports = { newAddress }
