/**
 * Subscribe to status updates for a single invoice
 *
 * @param {string} rHash
 * @param {Object} opts
 * @param {import('../lnd-setup').LndClient} opts.client
 * @returns {import('grpc').ClientReadableStream}
 */
function subscribeSingleInvoice (rHash, { client }) {
  return client.invoices.subscribeSingleInvoice({ rHash })
}

module.exports = subscribeSingleInvoice
