const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const payInvoice = rewire(path.resolve(__dirname, 'pay-invoice'))

describe('pay-invoice', () => {
  let sendPaymentStub
  let clientStub
  let payment
  let paymentError
  let paymentRequest
  let res
  let logger
  let paymentPreimage

  beforeEach(() => {
    clientStub = sinon.stub()
    paymentError = null
    paymentPreimage = 'asdfasdf'
    payment = { paymentError, paymentPreimage }
    paymentRequest = 'INVOICE_PAYMENT_REQUEST'
    logger = {
      info: sinon.stub(),
      debug: sinon.stub()
    }

    sendPaymentStub = sinon.stub().returns(payment)
    payInvoice.__set__('sendPayment', sendPaymentStub)
    payInvoice.__set__('client', clientStub)
    payInvoice.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await payInvoice(paymentRequest)
  })

  it('sends a payment to lnd', () => {
    expect(sendPaymentStub).to.have.been.calledWith(paymentRequest, { client: clientStub })
  })

  it('returns null', () => {
    expect(res).to.eql(paymentPreimage)
  })
})
