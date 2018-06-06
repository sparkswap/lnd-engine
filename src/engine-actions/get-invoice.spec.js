const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getInvoice = rewire(path.resolve(__dirname, 'get-invoice'))

describe('getInvoice', () => {
  let invoiceHash
  let lookupInvoiceStub
  let clientStub
  let res
  let logger
  let decodePayReqStub
  let paymentHash
  let paymentRequest

  beforeEach(() => {
    invoiceHash = '1234'
    paymentHash = '2345'
    paymentRequest = '3456'
    lookupInvoiceStub = sinon.stub().returns(invoiceHash)
    decodePayReqStub = sinon.stub().returns(paymentHash)
    clientStub = sinon.stub()
    logger = {
      debug: sinon.stub()
    }

    getInvoice.__set__('lookupInvoice', lookupInvoiceStub)
    getInvoice.__set__('decodePaymentRequest', decodePayReqStub)
    getInvoice.__set__('client', clientStub)
    getInvoice.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await getInvoice(paymentRequest)
  })

  it('decodes a payment rquest', () => {
    expect(decodePayReqStub).to.have.been.calledWith(paymentRequest, sinon.match({ client: clientStub }))
  })

  it('gets an invoice from a payment hash', () => {
    expect(lookupInvoiceStub).to.have.been.calledWith(paymentHash, sinon.match({ client: clientStub }))
  })

  it('returns the result', () => {
    expect(res).to.be.eql(invoiceHash)
  })
})
