const { deadline } = require('../grpc-utils')

/**
 * We need to extend the deadline to 6 because currently LND uses a deadline of 5 for
 * the handshakeReadTimeout. Because our deadline will be hit before LND's,
 * we won't get the actual error accompanied by the peer failing to connect.
 * @constant
 * @type {number}
 * @default
 */
const TIMEOUT_IN_SECONDS = 6

/**
 * Given an error, detects if the error message says that the peer is already
 * connected
 *
 * @private
 * @param {Error} err
 * @returns {boolean}
 */
function alreadyConnected (err) {
  return (err && err.code === 2 && err.details && err.details.includes('already connected to peer'))
}

/**
 * Creates a new connection to an lnd node
 *
 * @param {string} publicKey
 * @param {string} host
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @param {Logger} opts.logger
 * @returns {Promise<void>}
 */
function connectPeer (publicKey, host, { client, logger }) {
  const addr = {
    pubkey: publicKey,
    host
  }

  return new Promise((resolve, reject) => {
    client.connectPeer({ addr }, { deadline: deadline(TIMEOUT_IN_SECONDS) }, (err, res) => {
      if (alreadyConnected(err)) {
        logger.info(`Peer already connected: ${publicKey}`)
        return resolve()
      } else if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

module.exports = connectPeer
