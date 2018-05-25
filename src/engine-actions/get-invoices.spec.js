const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getInvoices = rewire(path.resolve(__dirname, 'get-invoices'))

describe('getInvoices', () => {
  let pendingOnly
  let listInvoicesStub
  let clientStub
  let invoiceResponse

  beforeEach(() => {
    pendingOnly = true
    invoiceResponse = []
    listInvoicesStub = sinon.stub().returns(invoiceResponse)
    clientStub = sinon.stub()

    getInvoices.__set__('listInvoices', listInvoicesStub)
    getInvoices.__set__('client', clientStub)
  })

  describe('pendingOnly', () => {
    it('defaults to false if no params are passed in', async () => {
      await getInvoices()
      expect(listInvoicesStub).to.have.been.calledWith(false, sinon.match({ client: clientStub }))
    })
    it('defaults to false if no pendingOnly value exists', async () => {
      await getInvoices({ banana: 1234 })
      expect(listInvoicesStub).to.have.been.calledWith(false, sinon.match({ client: clientStub }))
    })
  })

  it('gets a list of invoices from lnd', async () => {
    await getInvoices({ pendingOnly })
    expect(listInvoicesStub).to.have.been.calledWith(pendingOnly, sinon.match({ client: clientStub }))
  })

  it('returns the result', async () => {
    const res = await getInvoices({ pendingOnly })
    expect(res).to.be.eql(invoiceResponse)
  })
})
