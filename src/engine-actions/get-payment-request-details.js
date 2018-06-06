const { decodePayReq } = require('../lnd-actions')

async function getPaymentRequestDetails (paymentRequestString) {
  return decodePayReq(paymentRequestString, { client: this.client })
}

module.exports = getPaymentRequestDetails
