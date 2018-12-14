const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isEngineUnlocked = rewire(path.resolve(__dirname, 'is-engine-unlocked'))

describe('isEngineUnlocked', () => {
  let engine
  let genSeedStub
  let isAvailableStub

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub()
    }
    genSeedStub = sinon.stub()
    isAvailableStub = sinon.stub().resolves(true)

    isEngineUnlocked.__set__('genSeed', genSeedStub)
    isEngineUnlocked.__set__('isAvailable', isAvailableStub)
  })

  it('makes a call to genSeed to see if lnd is unlocked', async () => {
    await isEngineUnlocked.call(engine)
    expect(genSeedStub).to.have.been.calledWith(sinon.match({ client: engine.walletUnlocker }))
  })

  it('throws an error if the call to genSeed fails unexpectedly', async () => {
    const error = 'bad request'
    genSeedStub.throws(new Error(error))
    expect(isEngineUnlocked.call(engine)).to.eventually.be.rejectedWith(error)
  })

  it('returns true if genSeeds is not implemented', async () => {
    const error = new Error()
    error.code = 12
    genSeedStub.throws(error)
    const res = await isEngineUnlocked.call(engine)
    expect(res).to.be.eql(true)
  })

  it('returns true if a wallet already exists', async () => {
    const error = new Error('wallet already exists')
    genSeedStub.throws(error)
    const res = await isEngineUnlocked.call(engine)
    expect(res).to.be.eql(true)
  })

  it('returns false if a wallet already exists but the wallet is still locked', async () => {
    const error = new Error('wallet already exists')
    genSeedStub.throws(error)
    const lnError = new Error('Unimplemented')
    lnError.code = 12
    isAvailableStub.throws(lnError)
    const res = await isEngineUnlocked.call(engine)
    expect(res).to.be.eql(false)
  })

  it('returns true if a wallet already exists and the engine is available', async () => {
    const error = new Error('wallet already exists')
    genSeedStub.throws(error)
    const res = await isEngineUnlocked.call(engine)
    expect(res).to.be.eql(true)
  })
})
