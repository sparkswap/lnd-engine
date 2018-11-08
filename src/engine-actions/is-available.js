const { promisify } = require('util')

const { deadline } = require('../grpc-utils')

/**
 * Queries LND for a successful response
 *
 * @return {String} identityPubkey
 */
async function isAvailable () {
  const res = await promisify(this.client.getInfo)({}, { deadline: deadline() })
  this.logger.debug(res)
  return true
}

module.exports = isAvailable
