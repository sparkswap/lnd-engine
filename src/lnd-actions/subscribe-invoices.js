/**
 * Check's an invoice status
 *
 * @function
 * @see {@link http://api.lightning.community/#subscribeInvoices}
 * @return {ReadableStream} Readable stream from gprc
 */
function subscribeInvoices ({ client }) {
  return client.subscribeInvoices({})
}

module.exports = subscribeInvoices
