const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isInvoicePaid = rewire(path.resolve(__dirname, 'is-invoice-paid'))

describe('isInvoicePaid', () => {
  let paymentRequestHash
  let clientStub
  let res
  let lookupInvoiceStub
  let settled
  let logger
  let decodePayReqStub
  let paymentHash

  beforeEach(() => {
    settled = true
    paymentHash = '1234 '
    paymentRequestHash = '2345'
    lookupInvoiceStub = sinon.stub().returns({ settled })
    decodePayReqStub = sinon.stub().returns({ paymentHash })
    clientStub = sinon.stub()
    logger = {
      debug: sinon.stub()
    }

    isInvoicePaid.__set__('lookupInvoice', lookupInvoiceStub)
    isInvoicePaid.__set__('decodePaymentRequest', decodePayReqStub)
    isInvoicePaid.__set__('client', clientStub)
    isInvoicePaid.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await isInvoicePaid(paymentRequestHash)
  })

  it('decodes an invoice from the provided payment request', () => {
    expect(decodePayReqStub).to.have.been.calledWith(paymentRequestHash, sinon.match({ client: clientStub }))
  })

  it('looks up the invoice by invoice hash', () => {
    expect(lookupInvoiceStub).to.have.been.calledWith(paymentHash, sinon.match({ client: clientStub }))
  })

  it('returns true if the invoice is settled', () => {
    expect(res).to.be.eql(true)
  })
})
