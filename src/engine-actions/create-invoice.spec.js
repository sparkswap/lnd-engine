const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createInvoice = rewire(path.resolve(__dirname, 'create-invoice'))

describe('createInvoice', () => {
  let memo
  let expiry
  let commonValue
  let addInvoiceStub
  let clientStub
  let invoiceResponse
  let paymentRequest
  let currencyConfig
  let res

  beforeEach(() => {
    memo = 'MEMO'
    expiry = '2000'
    commonValue = '100'
    paymentRequest = '1234'
    invoiceResponse = { paymentRequest }
    addInvoiceStub = sinon.stub().returns(invoiceResponse)
    clientStub = sinon.stub()
    currencyConfig = {
      quantumsPerCommon: '100'
    }

    createInvoice.__set__('addInvoice', addInvoiceStub)
  })

  beforeEach(async () => {
    res = await createInvoice.call({ currencyConfig, client: clientStub }, memo, expiry, commonValue)
  })

  it('adds an invoice through lnd', () => {
    expect(addInvoiceStub).to.have.been.calledWith(sinon.match({ memo, expiry, value: '10000' }), sinon.match({ client: clientStub }))
  })

  it('returns a paymentRequest hash', () => {
    expect(res).to.be.eql(paymentRequest)
  })
})
