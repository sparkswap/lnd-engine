const { listChannels } = require('../lnd-actions')

/**
 * Returns a list of all invoices on the engine instance
 *
 * @param {Boolean} [pendingOnly=false] if we return ONLY pending invoices
 * @return {Promise}
 */
async function getChannels () {
  return listChannels({ client: this.client })
}

module.exports = getChannels
