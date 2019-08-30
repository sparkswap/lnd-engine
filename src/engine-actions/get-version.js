const { getInfo } = require('../lnd-actions')

/**
 * Returns the lnd instance's version
 *
 * @returns {Promise<string>} version
 */
async function getVersion () {
  const { version } = await getInfo({ client: this.client })
  return version
}

module.exports = getVersion
