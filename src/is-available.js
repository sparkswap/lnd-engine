const { getInfo } = require('./lnd-actions')

/**
 * Queries LND for a successful response
 *
 * @return {String} identityPubkey
 */
async function isAvailable () {
  await getInfo({ client: this.client })
  return true
}

module.exports = isAvailable
