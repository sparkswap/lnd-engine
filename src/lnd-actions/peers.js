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
