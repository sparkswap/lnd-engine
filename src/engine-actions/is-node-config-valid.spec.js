const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isNodeConfigValid = rewire(path.resolve(__dirname, 'is-node-config-valid'))

describe('isNodeConfigValid', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let currencyConfig
  let engine
  let logger

  beforeEach(() => {
    getInfoResponse = { chains: [ 'bitcoin' ] }
    getInfoStub = sinon.stub().returns(getInfoResponse)

    isNodeConfigValid.__set__('getInfo', getInfoStub)

    clientStub = sinon.stub()
    currencyConfig = {
      chainName: 'bitcoin'
    }
    logger = {
      error: sinon.stub()
    }
    engine = {
      client: clientStub,
      logger,
      currencyConfig,
      unlocked: true
    }
  })

  it('returns true if configuration matches', async () => {
    expect(await isNodeConfigValid.call(engine)).to.be.eql(true)
  })

  it('gets info on a specified lnd instance', async () => {
    await isNodeConfigValid.call(engine)
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('throws if LND has more than one chain active', () => {
    getInfoResponse.chains = [ 'bitcoin', 'litecoin' ]
    return expect(isNodeConfigValid.call(engine)).to.eventually.be.rejectedWith('at most one chain')
  })

  it('throws if LND has no chains active', () => {
    getInfoResponse.chains = []
    return expect(isNodeConfigValid.call(engine)).to.eventually.be.rejectedWith('no chains configured')
  })

  it('throws if LND has a different chain active', () => {
    getInfoResponse.chains = [ 'litecoin' ]
    return expect(isNodeConfigValid.call(engine)).to.eventually.be.rejectedWith('Mismatched configuration')
  })
})
