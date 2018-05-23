/**
 * Invoice
 * @module src/lnd-actions/invoice
 */

const { deadline } = require('../grpc-utils')

/**
 * Creates an invoice on lnd
 *
 * @function
 * @see {@link http://api.lightning.community/#addinvoice}
 * @param {String} [memo='']
 * @param {Int64} expiry invoice expiry in seconds
 * @param {Int64} value
 * @returns {Promise<String>} rHash
 */
function create (memo, expiry, value) {
  const params = {
    memo,
    expiry,
    value
  }

  return new Promise((resolve, reject) => {
    this.client.addInvoice(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      const { rHash } = res

      return resolve(rHash)
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
    this.client.lookupInvoice({ rHash }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      // TODO: Figure out what fields to return
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
    this.client.listInvoices({ pendingOnly }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      // TODO: Figure out if we should return less info
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
