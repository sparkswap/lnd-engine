const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isInvoicePaid = rewire(path.resolve(__dirname, 'is-invoice-paid'))

describe('isInvoicePaid', () => {
  let paymentRequest
  let clientStub
  let res
  let lookupInvoiceStub
  let logger
  let decodePayReqStub
  let paymentHash

  beforeEach(() => {
    paymentHash = 'deadbeef'
    paymentRequest = '2345'
    lookupInvoiceStub = sinon.stub().resolves({ state: 'SETTLED' })
    decodePayReqStub = sinon.stub().resolves({ paymentHash })
    clientStub = sinon.stub()
    logger = {
      debug: sinon.stub()
    }

    isInvoicePaid.__set__('lookupInvoice', lookupInvoiceStub)
    isInvoicePaid.__set__('decodePaymentRequest', decodePayReqStub)
    isInvoicePaid.__set__('client', clientStub)
    isInvoicePaid.__set__('logger', logger)
  })

  beforeEach(async () => {
    res = await isInvoicePaid(paymentRequest)
  })

  it('decodes an invoice from the provided payment request', () => {
    expect(decodePayReqStub).to.have.been.calledWith(paymentRequest, sinon.match({ client: clientStub }))
  })

  it('looks up the invoice by invoice hash', () => {
    expect(lookupInvoiceStub).to.have.been.calledWith({ rHash: '3q2+7w==' }, sinon.match({ client: clientStub }))
  })

  it('returns true if the invoice is settled', () => {
    expect(res).to.be.true()
  })

  it('returns false if the invoice is not settled', async () => {
    lookupInvoiceStub.resolves({ state: 'ACCEPTED' })
    expect(await isInvoicePaid(paymentRequest)).to.be.false()
  })
})
