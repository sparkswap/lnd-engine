const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const prepareSwap = rewire(path.resolve(__dirname, 'prepare-swap'))

describe('prepareSwap', () => {
  let orderId
  let value
  let addHoldInvoiceStub
  let clientStub
  let invoiceResponse
  let paymentRequest
  let swapHash
  let res

  beforeEach(() => {
    orderId = '928uq9afds8as9df_fasdfj'
    value = '100'
    paymentRequest = '1234'
    swapHash = '1234'
    invoiceResponse = { paymentRequest }
    addHoldInvoiceStub = sinon.stub().resolves(invoiceResponse)
    clientStub = sinon.stub()

    prepareSwap.__set__('addHoldInvoice', addHoldInvoiceStub)
    prepareSwap.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await prepareSwap(orderId, swapHash, value)
  })

  it('adds an invoice through lnd', () => {
    expect(addHoldInvoiceStub).to.have.been.calledWith({ memo: `sparkswap-swap-pivot:${orderId}`, expiry: '3600', value, hash: swapHash }, sinon.match({ client: clientStub }))
  })

  it('returns an invoice hash hash', () => {
    expect(res).to.be.eql(paymentRequest)
  })
})
