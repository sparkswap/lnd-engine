const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const payInvoice = rewire(path.resolve(__dirname, 'pay-invoice'))

describe('pay-invoice', () => {
  let sendPaymentStub
  let decodeStub
  let addInvoiceStub
  let clientStub
  let payment
  let paymentError
  let decodedPayment
  let invoiceValue
  let decodedDescription
  let refundInvoice
  let refundPaymentRequest
  let paymentRequest
  let res
  let logger

  beforeEach(() => {
    clientStub = sinon.stub()
    paymentError = null
    payment = { paymentError }
    invoiceValue = 1000
    decodedDescription = 'INVOICE_DESCRIPTION'
    refundPaymentRequest = 'REFUND_PAYMENT_REQUEST'
    paymentRequest = 'INVOICE_PAYMENT_REQUEST'
    decodedPayment = {
      numSatoshis: invoiceValue,
      description: decodedDescription
    }
    logger = {
      info: sinon.stub(),
      debug: sinon.stub()
    }
    refundInvoice = {
      paymentRequest: refundPaymentRequest
    }

    sendPaymentStub = sinon.stub().returns(payment)
    decodeStub = sinon.stub().returns(decodedPayment)
    addInvoiceStub = sinon.stub().returns(refundInvoice)

    payInvoice.__set__('sendPayment', sendPaymentStub)
    payInvoice.__set__('decodePaymentRequest', decodeStub)
    payInvoice.__set__('addInvoice', addInvoiceStub)
    payInvoice.__set__('client', clientStub)
    payInvoice.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await payInvoice(paymentRequest)
  })

  it('sends a payment to lnd', () => {
    expect(sendPaymentStub).to.have.been.calledWith(paymentRequest, { client: clientStub })
  })

  it('decodes a paymentRequest', () => {
    expect(decodeStub).to.have.been.calledWith(paymentRequest, { client: clientStub })
  })

  it('creates a refund invoice', () => {
    const expiryPrefix = payInvoice.__get__('REFUND_MEMO_PREFIX')
    const expiry = payInvoice.__get__('DEFAULT_INVOICE_EXPIRY')

    expect(addInvoiceStub).to.have.been.calledWith(
      `${expiryPrefix} ${decodedDescription}`,
      expiry,
      invoiceValue,
      { client: clientStub }
    )
  })

  it('returns a refund invoice', () => {
    expect(res).to.eql(refundPaymentRequest)
  })
})
