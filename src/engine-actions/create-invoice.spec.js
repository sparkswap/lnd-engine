const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createInvoice = rewire(path.resolve(__dirname, 'create-invoice'))

describe('createInvoice', () => {
  let memo
  let expiry
  let value
  let addInvoiceStub
  let clientStub
  let invoiceResponse
  let paymentRequest
  let res

  beforeEach(() => {
    memo = 'MEMO'
    expiry = '2000'
    value = '100'
    paymentRequest = '1234'
    invoiceResponse = { paymentRequest }
    addInvoiceStub = sinon.stub().returns(invoiceResponse)
    clientStub = sinon.stub()

    createInvoice.__set__('addInvoice', addInvoiceStub)
    createInvoice.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await createInvoice(memo, expiry, value)
  })

  it('adds an invoice through lnd', () => {
    expect(addInvoiceStub).to.have.been.calledWith(sinon.match({ memo, expiry, value }), sinon.match({ client: clientStub }))
  })

  it('returns a paymentRequest hash', () => {
    expect(res).to.be.eql(paymentRequest)
  })
})
