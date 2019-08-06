const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const prepareSwap = rewire(path.resolve(__dirname, 'prepare-swap'))

describe('prepareSwap', () => {
  let value
  let addHoldInvoiceStub
  let lookupInvoiceStub
  let invoiceResponse
  let paymentRequest
  let existingPaymentRequest
  let swapHash
  let expiryTime
  let cltvExpiry

  const client = sinon.stub()
  const engine = {
    client,
    secondsPerBlock: 600,
    logger: {
      info: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
  }

  beforeEach(() => {
    value = '100'
    paymentRequest = '1234'
    existingPaymentRequest = '12345'
    swapHash = '1234'
    // add 10ms to 60s so flooring to the nearest second in prepareSwap gives 60
    expiryTime = new Date((new Date()).getTime() + 60010)
    cltvExpiry = 3600
    invoiceResponse = { paymentRequest }
    addHoldInvoiceStub = sinon.stub().resolves(invoiceResponse)

    lookupInvoiceStub = sinon.stub().throws({})
    prepareSwap.__set__('lookupInvoice', lookupInvoiceStub)
    prepareSwap.__set__('addHoldInvoice', addHoldInvoiceStub)
    prepareSwap.__set__('client', client)
  })

  it('adds an invoice through lnd', async () => {
    await prepareSwap.call(engine, swapHash, value, expiryTime, cltvExpiry)
    expect(addHoldInvoiceStub).to.have.been.calledWith({
      memo: 'sparkswap-swap-pivot',
      hash: swapHash,
      value,
      expiry: '60',
      cltvExpiry: 6
    }, sinon.match({ client }))
  })

  it('is idempotent', async () => {
    addHoldInvoiceStub.throws(new Error('Invoice with hash already exists'))
    lookupInvoiceStub.withArgs({ rHash: swapHash }).resolves({
      paymentRequest: existingPaymentRequest,
      cltvExpiry: 6,
      value
    })
    const res = await prepareSwap.call(engine, swapHash, value, expiryTime, cltvExpiry)
    expect(res).to.be.eql(existingPaymentRequest)
  })

  it('returns an invoice hash', async () => {
    const res = await prepareSwap.call(engine, swapHash, value, expiryTime, cltvExpiry)
    expect(res).to.be.eql(paymentRequest)
  })
})
