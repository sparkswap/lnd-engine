const grpc = require('grpc')

const {
  getInfo,
  genSeed
} = require('../lnd-actions')

/**
 * Queries LND for a response as an assumption if the engine is down or not
 *
 * @return {Boolean}
 */
function isAvailable () {
  return new Promise((resolve, reject) => {
    // We call genSeed to see if the engine is up. If we receive a response from
    // the engine, then we can assume that it is available
    genSeed({ client: this.walletUnlocker })
      .then(() => resolve(true))
      .catch((e) => {
        // If we receive a timeout, then it means the engine is down and we can simply
        // return
        if (e.code === grpc.status.DEADLINE_EXCEEDED || e.code === grpc.status.UNAVAILABLE) {
          return resolve(false)
        }

        // If this error code is 'unavailable', then that means the node may be down
        // however it is functioning to take requests.
        //
        // If the error code is 'unimplemented', then this means the engine was started
        // in development mode with 'noseedbackup' enabled
        //
        // TODO: Need to figure out a better way to handle development mode for
        //       validations
        if (e.code !== grpc.status.UNIMPLEMENTED) {
          return resolve(true)
        }

        // We should only call `getInfo` in the case of development mode for an
        // engine since the WalletUnlocker RPC (genSeed) should always be available
        // on our engine in production usage
        getInfo({ client: this.client })
          .then(() => resolve(true))
          .catch((e) => {
            if (e.code === grpc.status.DEADLINE_EXCEEDED || e.code === grpc.status.UNAVAILABLE) {
              resolve(false)
            }

            resolve(true)
          })
      })
  })
}

module.exports = isAvailable
