const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPaymentRequestDetails = rewire(path.resolve(__dirname, 'get-payment-request-details'))

describe('getPaymentRequestDetails', () => {
  let paymentRequestString
  let decodePaymentRequestStub
  let clientStub
  let res

  beforeEach(() => {
    paymentRequestString = '1234asdf'
    decodePaymentRequestStub = sinon.stub().returns({value: 100})
    clientStub = sinon.stub()

    getPaymentRequestDetails.__set__('decodePaymentRequest', decodePaymentRequestStub)
    getPaymentRequestDetails.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getPaymentRequestDetails(paymentRequestString)
  })

  it('gets decoded payment request details', () => {
    expect(decodePaymentRequestStub).to.have.been.calledWith(paymentRequestString, sinon.match({ client: clientStub }))
  })

  it('returns the result', () => {
    expect(res).to.be.eql({value: 100})
  })
})
