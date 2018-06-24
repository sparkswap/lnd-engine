const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createRefundInvoice = rewire(path.resolve(__dirname, 'create-refund-invoice'))

describe('create-refund-invoice', () => {
  let decodeStub
  let addInvoiceStub
  let clientStub
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

    decodeStub = sinon.stub().returns(decodedPayment)
    addInvoiceStub = sinon.stub().returns(refundInvoice)

    createRefundInvoice.__set__('decodePaymentRequest', decodeStub)
    createRefundInvoice.__set__('addInvoice', addInvoiceStub)
    createRefundInvoice.__set__('client', clientStub)
    createRefundInvoice.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await createRefundInvoice(paymentRequest)
  })

  it('decodes a paymentRequest', () => {
    expect(decodeStub).to.have.been.calledWith(paymentRequest, { client: clientStub })
  })

  it('creates a refund invoice', () => {
    const expiryPrefix = createRefundInvoice.__get__('REFUND_MEMO_PREFIX')
    const expiry = createRefundInvoice.__get__('DEFAULT_INVOICE_EXPIRY')

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
