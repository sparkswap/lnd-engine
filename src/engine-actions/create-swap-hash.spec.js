const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createSwapHash = rewire(path.resolve(__dirname, 'create-swap-hash'))

describe('createSwapHash', () => {
  let orderId
  let value
  let addInvoiceStub
  let clientStub
  let invoiceResponse
  let rHash
  let res

  beforeEach(() => {
    orderId = '928uq9afds8as9df_fasdfj'
    value = '100'
    rHash = Buffer.from('1234')
    invoiceResponse = { rHash }
    addInvoiceStub = sinon.stub().resolves(invoiceResponse)
    clientStub = sinon.stub()

    createSwapHash.__set__('addInvoice', addInvoiceStub)
    createSwapHash.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await createSwapHash(orderId, value)
  })

  it('adds an invoice through lnd', () => {
    expect(addInvoiceStub).to.have.been.calledWith({ memo: `sparkswap-swap-terminus:${orderId}`, expiry: '3600', value }, sinon.match({ client: clientStub }))
  })

  it('returns an invoice hash hash', () => {
    expect(res).to.be.eql(rHash)
  })
})
