const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getInvoiceValue = rewire(path.resolve(__dirname, 'get-invoice-value'))

describe('getInvoiceValue', () => {
  let paymentRequestString
  let decodePaymentRequestStub
  let clientStub
  let res
  let expectedValue

  beforeEach(() => {
    paymentRequestString = '1234asdf'
    expectedValue = 100
    decodePaymentRequestStub = sinon.stub().resolves({ numSatoshis: expectedValue })
    clientStub = sinon.stub()

    getInvoiceValue.__set__('decodePaymentRequest', decodePaymentRequestStub)
    getInvoiceValue.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getInvoiceValue(paymentRequestString)
  })

  it('gets decoded payment request details', () => {
    expect(decodePaymentRequestStub).to.have.been.calledWith(paymentRequestString, sinon.match({ client: clientStub }))
  })

  it('returns the result', () => {
    expect(res).to.be.eql(expectedValue)
  })
})
