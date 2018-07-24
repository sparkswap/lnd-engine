const path = require('path')
const { expect, rewire, sinon, delay } = require('test/test-helper')

const getSettledSwapPreimage = rewire(path.resolve(__dirname, 'get-settled-swap-preimage'))

describe('getSettledSwapPreimage', () => {
  let clientStub
  let engine
  let lookupInvoiceStub
  let logger
  let subscribeInvoicesStub
  let swapHash
  let invoiceStream
  let otherInvoice
  let theSettledInvoice
  let theUnsettledInvoice

  function streamReturnsInvoices (stream, invoices) {
    stream.on.withArgs('data').callsFake(async (evt, listener) => {
      for (var i = 0; i < invoices.length; i++) {
        await delay(10)
        listener(invoices[i])
      }
    })
  }

  function streamErrors (stream, error) {
    stream.on.withArgs('error').callsFake(async (evt, listener) => {
      await delay(10)
      listener(error)
    })
  }

  function streamCloses (stream) {
    stream.on.withArgs('end').callsFake(async (evt, listener) => {
      await delay(10)
      listener()
    })
  }

  beforeEach(() => {
    swapHash = 'aisudf0asufdhasdfnjasdofindf=='
    otherInvoice = {
      rHash: 'ajsdf0ja0sjf90a9sjf08h986868='
    }
    theSettledInvoice = {
      rHash: swapHash,
      rPreimage: 'fake preimage',
      settled: true
    }
    theUnsettledInvoice = {
      rHash: swapHash,
      settled: false
    }
    lookupInvoiceStub = sinon.stub().resolves(theUnsettledInvoice)
    invoiceStream = {
      on: sinon.stub(),
      removeListener: sinon.stub()
    }
    subscribeInvoicesStub = sinon.stub().returns(invoiceStream)
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
    getSettledSwapPreimage.__set__('subscribeInvoices', subscribeInvoicesStub)
  })

  it('throws an error if the swapHash does not exist', () => {
    swapHash = undefined

    return expect(getSettledSwapPreimage.call(engine, swapHash)).to.eventually.be.rejectedWith('Swaphash must be defined')
  })

  it('looks up the invoice', async () => {
    lookupInvoiceStub.resolves(theSettledInvoice)
    await getSettledSwapPreimage.call(engine, swapHash)

    expect(lookupInvoiceStub).to.have.been.calledOnce()
    expect(lookupInvoiceStub).to.have.been.calledWith(Buffer.from(swapHash, 'base64').toString('hex'), { client: clientStub })
  })

  it('throws if the invoice does not exist', () => {
    lookupInvoiceStub.rejects(new Error('fake error'))

    return expect(getSettledSwapPreimage.call(engine, swapHash)).to.eventually.be.rejectedWith('fake error')
  })

  it('returns the preimage if the invoice is already settled', async () => {
    lookupInvoiceStub.resolves(theSettledInvoice)
    const preimage = await getSettledSwapPreimage.call(engine, swapHash)

    expect(preimage).to.be.eql(theSettledInvoice.rPreimage)
  })

  it('subscribes to new invoices', async () => {
    streamReturnsInvoices(invoiceStream, [ theSettledInvoice ])
    await getSettledSwapPreimage.call(engine, swapHash)

    expect(subscribeInvoicesStub).to.have.been.calledOnce()
    expect(subscribeInvoicesStub).to.have.been.calledWith({ client: clientStub })
  })

  it('ignores invoices for other hashes', async () => {
    streamReturnsInvoices(invoiceStream, [ otherInvoice ])

    let isSettled = false
    getSettledSwapPreimage.call(engine, swapHash).then(() => { isSettled = true })

    await delay(15)

    expect(isSettled).to.be.eql(false)
  })

  it('ignores notifications that are not settlement', async () => {
    streamReturnsInvoices(invoiceStream, [ theUnsettledInvoice ])

    let isSettled = false
    getSettledSwapPreimage.call(engine, swapHash).then(() => { isSettled = true })

    await delay(15)

    expect(isSettled).to.be.eql(false)
  })

  it('throws if the stream errors', () => {
    streamErrors(invoiceStream, new Error('fake error'))

    return expect(getSettledSwapPreimage.call(engine, swapHash)).to.eventually.be.rejectedWith('fake error')
  })

  it('throws if the stream closes early', () => {
    streamCloses(invoiceStream)

    return expect(getSettledSwapPreimage.call(engine, swapHash)).to.eventually.be.rejectedWith('closed stream')
  })

  it('returns the preimage from the subscription', async () => {
    streamReturnsInvoices(invoiceStream, [ otherInvoice, theSettledInvoice ])

    const preimage = await getSettledSwapPreimage.call(engine, swapHash)

    expect(preimage).to.be.eql(theSettledInvoice.rPreimage)
  })

  it('removes listeners', async () => {
    streamReturnsInvoices(invoiceStream, [ theSettledInvoice ])
    await getSettledSwapPreimage.call(engine, swapHash)
    const dataListener = invoiceStream.on.withArgs('data').args[0][1]
    const endListener = invoiceStream.on.withArgs('end').args[0][1]
    const errorListener = invoiceStream.on.withArgs('error').args[0][1]

    expect(invoiceStream.removeListener).to.have.been.calledThrice()
    expect(invoiceStream.removeListener).to.have.been.calledWith('data', dataListener)
    expect(invoiceStream.removeListener).to.have.been.calledWith('end', endListener)
    expect(invoiceStream.removeListener).to.have.been.calledWith('error', errorListener)
  })
})
