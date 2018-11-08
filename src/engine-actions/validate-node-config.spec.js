const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const validateNodeConfig = rewire(path.resolve(__dirname, 'validate-node-config'))

describe('validate-node-config', () => {
  describe('validateNodeConfig', () => {
    let getInfoResponse
    let getInfoStub
    let clientStub
    let currencyConfig
    let engine
    let isEngineUnlockedStub
    let genSeedStub
    let walletUnlockerStub

    let reverts = []

    beforeEach(() => {
      getInfoResponse = { chains: [ 'bitcoin' ] }
      getInfoStub = sinon.stub().returns(getInfoResponse)
      genSeedStub = sinon.stub().resolves()
      isEngineUnlockedStub = sinon.stub()

      reverts.push(validateNodeConfig.__set__('getInfo', getInfoStub))
      reverts.push(validateNodeConfig.__set__('genSeed', genSeedStub))
      reverts.push(validateNodeConfig.__set__('isEngineUnlocked', isEngineUnlockedStub))

      clientStub = sinon.stub()
      walletUnlockerStub = sinon.stub()
      currencyConfig = {
        chainName: 'bitcoin'
      }
      engine = {
        client: clientStub,
        walletUnlocker: walletUnlockerStub,
        currencyConfig,
        logger: {
          error: sinon.stub()
        }
      }
    })

    afterEach(() => {
      reverts.forEach(r => r())
    })

    context('engine is unlocked', () => {
      beforeEach(() => {
        isEngineUnlockedStub.resolves(true)
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

    context('engine is not unlocked', () => {
      beforeEach(() => {
        isEngineUnlockedStub.resolves(false)
      })

      it('does not attempt to make a Lightning rpc call', async () => {
        await validateNodeConfig.bind(engine)()
        expect(getInfoStub).to.not.have.been.called()
      })

      it('makes a call to WalletUnlocked rpc to check if the daemon is accessible', async () => {
        await validateNodeConfig.call(engine)
        expect(genSeedStub).to.have.been.calledWith({ client: walletUnlockerStub })
      })

      it('returns true if configuration matches', async () => {
        expect(await validateNodeConfig.call(engine)).to.be.eql(true)
      })

      it('throws an error if the genseed call has failed', () => {
        genSeedStub.throws()
        return expect(validateNodeConfig.call(engine)).to.eventually.be.rejectedWith('Call to validate an unlocked engine')
      })
    })
  })

  describe('isEngineUnlocked', () => {
    let client
    let isEngineUnlocked
    let revert
    let getInfoStub

    beforeEach(() => {
      client = sinon.stub()
      getInfoStub = sinon.stub().resolves()

      revert = validateNodeConfig.__set__('getInfo', getInfoStub)
    })

    beforeEach(() => {
      isEngineUnlocked = validateNodeConfig.__get__('isEngineUnlocked')
    })

    afterEach(() => {
      revert()
    })

    it('makes a call to the Lightning service', async () => {
      await isEngineUnlocked(client)
      expect(getInfoStub).to.have.been.calledWith(sinon.match({ client }))
    })

    it('returns true if the call to Lightning service has been made', async () => {
      getInfoStub.throws(new Error())
      const res = await isEngineUnlocked(client)
      expect(res).to.be.eql(true)
    })

    it('returns true if the Lightning service call has failed, but is implemented', async () => {
      getInfoStub.throws(new Error())
      const res = await isEngineUnlocked(client)
      expect(res).to.be.eql(true)
    })

    it('returns false if the Lightning service call is not available', async () => {
      const error = new Error()
      error.code = 12
      getInfoStub.throws(error)
      const res = await isEngineUnlocked(client)
      expect(res).to.be.eql(false)
    })
  })
})
