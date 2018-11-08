const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const validateNodeConfig = rewire(path.resolve(__dirname, 'validate-node-config'))

describe('validateNodeConfig', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let currencyConfig
  let engine

  beforeEach(() => {
    getInfoResponse = { chains: [ 'bitcoin' ] }
    getInfoStub = sinon.stub().returns(getInfoResponse)

    validateNodeConfig.__set__('getInfo', getInfoStub)

    clientStub = sinon.stub()
    currencyConfig = {
      chainName: 'bitcoin'
    }
    engine = {
      client: clientStub,
      currencyConfig
    }
  })

  it('gets info on a specified lnd instance', async () => {
    await validateNodeConfig.call(engine)
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns true if configuration matches', async () => {
    expect(await validateNodeConfig.call(engine)).to.be.eql(true)
  })

  it('throws if LND has more than one chain active', () => {
    getInfoResponse.chains = [ 'bitcoin', 'litecoin' ]
    return expect(validateNodeConfig.call(engine)).to.eventually.be.rejectedWith('at most one chain')
  })

  it('throws if LND has no chains active', () => {
    getInfoResponse.chains = []
    return expect(validateNodeConfig.call(engine)).to.eventually.be.rejectedWith('no chains configured')
  })

  it('throws if LND has a different chain active', () => {
    getInfoResponse.chains = [ 'litecoin' ]
    return expect(validateNodeConfig.call(engine)).to.eventually.be.rejectedWith('Mismatched configuration')
  })
})
