const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isInvoicePaid = rewire(path.resolve(__dirname, 'is-invoice-paid'))

describe('isInvoicePaid', () => {
  let invoiceHash
  let lookupInvoiceStub
  let clientStub
  let res

  beforeEach(() => {
    invoiceHash = '1234'
    lookupInvoiceStub = sinon.stub().returns({ settled: true })
    clientStub = sinon.stub()

    isInvoicePaid.__set__('lookupInvoice', lookupInvoiceStub)
    isInvoicePaid.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await isInvoicePaid(invoiceHash)
  })

  it('looks up the invoice by invoice hash', () => {
    expect(lookupInvoiceStub).to.have.been.calledWith(invoiceHash, sinon.match({ client: clientStub }))
  })

  it('returns true if the invoice is settled', () => {
    expect(res).to.be.eql(true)
  })
})
