/**
 * Check's an invoice status
 *
 * @see http://api.lightning.community/#subscribeInvoices
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {ReadableStream} Readable stream from gprc
 */
function subscribeInvoices ({ client }) {
  // We don't use a deadline here because this is a long-running operation
  return client.subscribeInvoices({})
}

module.exports = subscribeInvoices
