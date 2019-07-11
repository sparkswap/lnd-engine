/** @typedef {import('../lnd-setup').LndClient} LndClient */
/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/**
 * Subscribe to status updates for a single invoice
 *
 * @param {string} rHash
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {ClientReadableStream}
 */
function subscribeSingleInvoice (rHash, { client }) {
  return client.invoices.subscribeSingleInvoice({ rHash })
}

module.exports = subscribeSingleInvoice
