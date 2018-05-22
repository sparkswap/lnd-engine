/**
 * Invoice
 * @module src/lnd-actions/invoice
 */

/**
 * Creates an invoice
 *
 * @function
 * @see {@link http://api.lightning.community/#addinvoice}
 * @param {Object} params
 * @returns {Promise} addInvoice
 */
function create (params) {
  return new Promise((resolve, reject) => {
    this.client.addInvoice(params, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      return resolve(res)
    })
  })
}

/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#lookupInvoice}
 * @param {String} rHash - invoice request hash
 * @return {Object} response
 */
function status (rHash) {
  return new Promise((resolve, reject) => {
    this.client.lookupInvoice({ rHash }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      return resolve(res)
    })
  })
}

/**
 * Returns a list of invoices
 *
 * @param {Boolean} pendingOnly if true, returns only pending invoices
 */
function listInvoices (pendingOnly) {
  return new Promise((resolve, reject) => {
    this.client.listInvoices({ pendingOnly }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      return resolve(res)
    })
  })
}

/**
 * Returns a list of all invoices on the engine instance
 * @return {Promise}
 */
async function all () {
  return listInvoices.call(this, false)
}

/**
 * Returns a list of all pending invoices on the engine instance
 * @return {Promise}
 */
async function pending () {
  return listInvoices.call(this, true)
}

module.exports = {
  create,
  status,
  all,
  pending
}
