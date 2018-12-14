const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isEngineUnlocked = rewire(path.resolve(__dirname, 'is-engine-unlocked'))

describe('isEngineUnlocked', () => {
  let engine
  let genSeedStub

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub()
    }
    genSeedStub = sinon.stub()

    isEngineUnlocked.__set__('genSeed', genSeedStub)
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

  context('wallet is unlocked', () => {
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
  })
})
