const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const validateNodeConfig = rewire(path.resolve(__dirname, 'validate-node-config'))

describe('validateNodeConfig', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let currencyConfig
  let engine
  let walletUnlockedStub
  let warnStub

  beforeEach(() => {
    getInfoResponse = { chains: [ 'bitcoin' ] }
    getInfoStub = sinon.stub().returns(getInfoResponse)
    walletUnlockedStub = sinon.stub().resolves(true)
    warnStub = sinon.stub()

    validateNodeConfig.__set__('getInfo', getInfoStub)
    validateNodeConfig.__set__('isEngineUnlocked', { call: walletUnlockedStub })

    clientStub = sinon.stub()
    currencyConfig = {
      chainName: 'bitcoin'
    }
    engine = {
      logger: {
        warn: warnStub
      },
      client: clientStub,
      currencyConfig
    }
  })

  context('wallet is not unlocked', () => {
    let res

    beforeEach(async () => {
      walletUnlockedStub.resolves(false)
      res = await validateNodeConfig.call(engine)
    })
    it('warns the user if a if a wallet is not unlocked', () => {
      expect(warnStub).to.have.been.calledWith(sinon.match('is not unlocked'))
    })

    it('returns false if wallet is not unlocked', () => {
      expect(res).to.be.eql(false)
    })
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
