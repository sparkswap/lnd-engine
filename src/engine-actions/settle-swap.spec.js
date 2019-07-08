const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const settleSwap = rewire(path.resolve(__dirname, 'settle-swap'))

describe('settleSwap', () => {
  let settleInvoiceStub
  let settleInvoiceResponse
  let preimage

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
    preimage = '1234'
    settleInvoiceResponse = { }
    settleInvoiceStub = sinon.stub().resolves(settleInvoiceResponse)

    settleSwap.__set__('settleInvoice', settleInvoiceStub)
    settleSwap.__set__('client', client)
  })

  it('settles invoice through lnd', async () => {
    const response = await settleSwap.call(engine, preimage)
    expect(response).to.be.eql(settleInvoiceResponse)
    expect(settleInvoiceStub).to.have.been.calledWith(
      preimage, sinon.match({ client }))
  })
})
