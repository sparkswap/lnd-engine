/**
 * Subscribe to status updates for a single invoice
 *
 * @param {Bytes} rHash
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {ReadableStream} Readable stream from grpc
 */
function subscribeSingleInvoice (rHash, { client }) {
  return client.subscribeSingleInvoice({ rHash })
}

module.exports = subscribeSingleInvoice
