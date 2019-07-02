const { deadline } = require('../grpc-utils')

/** @typedef {import('..').Logger} Logger */
/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Given an error, detects if the error message says that the peer is already
 * connected
 *
 * @private
 * @param {Object} err
 * @param {number} err.code
 * @param {string} err.details
 * @returns {boolean}
 */
function alreadyConnected (err) {
  return (err && err.code === 2 && err.details != null && err.details.includes('already connected to peer'))
}

/**
 * Creates a new connection to an lnd node
 *
 * @param {string} publicKey
 * @param {string} host
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @param {Logger} opts.logger
 * @returns {Promise<Object>}
 */
function connectPeer (publicKey, host, { client, logger }) {
  const addr = {
    pubkey: publicKey,
    host
  }

  return new Promise((resolve, reject) => {
    client.connectPeer({ addr }, { deadline: deadline() }, (err, res) => {
      if (alreadyConnected(err)) {
        logger.info(`Peer already connected: ${publicKey}`)
        return resolve()
      } else if (err) {
        return reject(err)
      }

      return resolve(res)
    })
  })
}

module.exports = connectPeer
