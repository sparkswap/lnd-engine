const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const prepareSwap = rewire(path.resolve(__dirname, 'prepare-swap'))

describe('prepareSwap', () => {
  let orderId
  let value
  let addInvoiceStub
  let clientStub
  let invoiceResponse
  let rHash
  let swapHash
  let res

  beforeEach(() => {
    orderId = '928uq9afds8as9df_fasdfj'
    value = '100'
    rHash = '1234'
    swapHash = '1234'
    invoiceResponse = { rHash }
    addInvoiceStub = sinon.stub().resolves(invoiceResponse)
    clientStub = sinon.stub()

    prepareSwap.__set__('addInvoice', addInvoiceStub)
    prepareSwap.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await prepareSwap(orderId, swapHash, value)
  })

  it('adds an invoice through lnd', () => {
    expect(addInvoiceStub).to.have.been.calledWith({ memo: `kinesis-swap-pivot:${orderId}`, expiry: '3600', value, externalPreimage: true, rHash: swapHash }, sinon.match({ client: clientStub }))
  })

  it('returns an invoice hash hash', () => {
    expect(res).to.be.eql(rHash)
  })
})
