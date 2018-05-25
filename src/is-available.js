const { getInfo } = require('./lnd-actions')

/**
 * Queries LND for a successful response
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
 */
async function isAvailable () {
  try {
    await getInfo({ client: this.client })
    return true
  } catch (e) {
    this.logger.error(e)
    return false
  }
}

module.exports = isAvailable
