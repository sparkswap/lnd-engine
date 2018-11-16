const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isEngineUnlocked = rewire(path.resolve(__dirname, 'is-engine-unlocked'))

describe('isEngineUnlocked', () => {
  let engine
  let genSeedStub

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub(),
      logger: {
        error: sinon.stub()
      }
    }
    genSeedStub = sinon.stub()

    isEngineUnlocked.__set__('genSeed', genSeedStub)
  })

  it('makes a call to genSeed to see if lnd is unlocked', async () => {
    await isEngineUnlocked.call(engine)
    expect(genSeedStub).to.have.been.calledWith(sinon.match({ client: engine.walletUnlocker }))
  })

  it('throws an error if the call to genSeed fails, but is implemented', async () => {
    const error = 'bad request'
    genSeedStub.throws(new Error(error))
    expect(isEngineUnlocked.call(engine)).to.eventually.be.rejectedWith(error)
  })

  context('wallet is unlocked', () => {
    let res

    beforeEach(() => {
      const error = new Error()
      error.code = 12
      genSeedStub.throws(error)
    })

    beforeEach(async () => {
      res = await isEngineUnlocked.call(engine)
    })

    it('returns true if an engine is unlocked', () => {
      expect(res).to.be.eql(true)
    })
  })
})
