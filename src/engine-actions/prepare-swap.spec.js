const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const prepareSwap = rewire(path.resolve(__dirname, 'prepare-swap'))

describe('prepareSwap', () => {
  let orderId
  let value
  let addHoldInvoiceStub
  let lookupInvoiceStub
  let clientStub
  let invoiceResponse
  let paymentRequest
  let existingPaymentRequest
  let swapHash
  let expiry
  let cltvExpiry

  beforeEach(() => {
    orderId = '928uq9afds8as9df_fasdfj'
    value = '100'
    paymentRequest = '1234'
    existingPaymentRequest = '12345'
    swapHash = '1234'
    expiry = 3600
    cltvExpiry = 144
    invoiceResponse = { paymentRequest }
    addHoldInvoiceStub = sinon.stub().resolves(invoiceResponse)
    clientStub = sinon.stub()

    lookupInvoiceStub = sinon.stub().throws({})
    prepareSwap.__set__('lookupInvoice', lookupInvoiceStub)
    prepareSwap.__set__('addHoldInvoice', addHoldInvoiceStub)
    prepareSwap.__set__('client', clientStub)
  })

  it('adds an invoice through lnd', async () => {
    await prepareSwap(orderId, swapHash, value, expiry, cltvExpiry)
    expect(addHoldInvoiceStub).to.have.been.calledWith({
      memo: `sparkswap-swap-pivot:${orderId}`,
      hash: swapHash,
      value,
      expiry,
      cltvExpiry
    }, sinon.match({ client: clientStub }))
  })

  it('is idempotent', async () => {
    const lookupInvoiceStub2 = sinon.stub().resolves({
      paymentRequest: existingPaymentRequest
    })
    prepareSwap.__set__('lookupInvoice', lookupInvoiceStub2)
    const res = await prepareSwap(orderId, swapHash, value, expiry, cltvExpiry)
    expect(res).to.be.eql(existingPaymentRequest)
  })

  it('returns an invoice hash', async () => {
    const res = await prepareSwap(orderId, swapHash, value, expiry, cltvExpiry)
    expect(res).to.be.eql(paymentRequest)
  })
})
