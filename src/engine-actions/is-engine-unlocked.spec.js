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
        debug: sinon.stub()
      }
    }
    genSeedStub = sinon.stub()

    isEngineUnlocked.__set__('genSeed', genSeedStub)
  })

  it('makes a call to genSeed to see if lnd is unlocked', async () => {
    await isEngineUnlocked.call(engine)
    expect(genSeedStub).to.have.been.calledWith(sinon.match({ client: engine.walletUnlocker }))
  })

  it('returns false if the call to genSeed fails, but is implemented', async () => {
    genSeedStub.throws()
    const res = await isEngineUnlocked.call(engine)
    expect(res).to.be.eql(false)
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

    it('creates a debug log', () => {
      expect(engine.logger.debug).to.have.been.calledWith(sinon.match('Error received'))
    })

    it('returns true if an engine is unlocked', () => {
      expect(res).to.be.eql(true)
    })
  })
})
