const { listInvoices } = require('../lnd-actions')

/**
 * Returns a list of all invoices on the engine instance
 *
 * @param {object} [args={}]
 * @param {boolean} [args.pendingOnly=false] - if we return ONLY pending invoices
 * @returns {Promise}
 */
async function getInvoices ({ pendingOnly = false } = {}) {
  return listInvoices(pendingOnly, { client: this.client })
}

module.exports = getInvoices
