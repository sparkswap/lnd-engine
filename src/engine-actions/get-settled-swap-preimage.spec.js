const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getSettledSwapPreimage = rewire(path.resolve(__dirname, 'get-settled-swap-preimage'))

describe('getSettledSwapPreimage', () => {
  let clientStub
  let engine
  let lookupInvoiceStub
  let logger
  let swapHash
  let theSettledInvoice
  let theUnsettledInvoice

  beforeEach(() => {
    swapHash = 'aisudf0asufdhasdfnjasdofindf=='
    theSettledInvoice = {
      rHash: swapHash,
      rPreimage: 'fake preimage',
      state: 'SETTLED'
    }
    theUnsettledInvoice = {
      rHash: swapHash,
      state: 'OPEN'
    }
    lookupInvoiceStub = sinon.stub().resolves(theUnsettledInvoice)

    clientStub = sinon.stub()
    logger = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    engine = {
      logger,
      client: clientStub
    }

    getSettledSwapPreimage.__set__('lookupInvoice', lookupInvoiceStub)
  })

  it('throws an error if the swapHash does not exist', () => {
    swapHash = undefined

    return expect(
      getSettledSwapPreimage.call(engine, swapHash)
    ).to.eventually.be.rejectedWith('Swap hash must be defined')
  })

  it('looks up the invoice', async () => {
    lookupInvoiceStub.resolves(theSettledInvoice)
    await getSettledSwapPreimage.call(engine, swapHash)

    expect(lookupInvoiceStub).to.have.been.calledOnce()
    expect(lookupInvoiceStub).to.have.been.calledWith(
      { rHash: swapHash }, { client: clientStub }
    )
  })

  it('throws if the invoice does not exist', () => {
    lookupInvoiceStub.rejects(new Error('fake error'))

    return expect(
      getSettledSwapPreimage.call(engine, swapHash)
    ).to.eventually.be.rejectedWith('fake error')
  })

  it('throws if the invoice is not settled', () => {
    lookupInvoiceStub.resolves(theUnsettledInvoice)

    return expect(
      getSettledSwapPreimage.call(engine, swapHash)
    ).to.eventually.be.rejectedWith('Cannot retrieve preimage from an invoice in a OPEN state.')
  })

  it('returns the preimage if the invoice is already settled', async () => {
    lookupInvoiceStub.resolves(theSettledInvoice)
    const preimage = await getSettledSwapPreimage.call(engine, swapHash)

    expect(preimage).to.be.eql(theSettledInvoice.rPreimage)
  })
})
