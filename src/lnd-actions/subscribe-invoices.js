/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#subscribeInvoices}
 * @return {ReadableStream} Readable stream from gprc
 */
function subscribeInvoices ({ client }) {
  // We don't use a deadline here because this is a long-running operation
  return client.subscribeInvoices({})
}

module.exports = subscribeInvoices
