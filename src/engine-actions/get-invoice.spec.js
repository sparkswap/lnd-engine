const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getInvoice = rewire(path.resolve(__dirname, 'get-invoice'))

describe('getInvoice', () => {
  let invoiceHash
  let lookupInvoiceStub
  let clientStub
  let res

  beforeEach(() => {
    invoiceHash = '1234'
    lookupInvoiceStub = sinon.stub().returns(invoiceHash)
    clientStub = sinon.stub()

    getInvoice.__set__('lookupInvoice', lookupInvoiceStub)
    getInvoice.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getInvoice(invoiceHash)
  })

  it('gets a wallet balance', () => {
    expect(lookupInvoiceStub).to.have.been.calledWith(invoiceHash, sinon.match({ client: clientStub }))
  })

  it('returns the result', () => {
    expect(res).to.be.eql(invoiceHash)
  })
})
