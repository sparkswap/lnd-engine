/**
 * Peers
 * @module src/lnd-actions/peers
 */

const { deadline } = require('../grpc-utils')

/**
 * Creates a new connection to an lnd node
 *
 * @param {String} publicKey
 * @param {String} host
 * @return {Promise<void>}
 */
function connect (publicKey, host) {
  const addr = {
    pubkey: publicKey,
    host
  }

  return new Promise((resolve, reject) => {
    this.client.connectPeer({ addr }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received successful responmse from lnd#connectPeer')

      return resolve()
    })
  })
}

/**
 * Given a publicKey, trys to find a connection with the peer
 *
 * @param {String} publicKey
 * @return {Promise<Object>} response
 */
function findByKey (publicKey) {
  return new Promise((resolve, reject) => {
    this.client.listPeers({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.info('ListPeers: ' + res)

      return resolve(res)
    })
  })
}

module.exports = {
  connect,
  findByKey
}
036334cfbb4d46d26105271aaa51abf809f7c448d8515d31cbccdef4a5d7b1a358
03de2c130825be099fbfaa4e5a94c3ee0814f43ce308826b47de8ae93a0ca7963f
