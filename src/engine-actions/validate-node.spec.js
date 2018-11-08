const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const validateNode = rewire(path.resolve(__dirname, 'validate-node'))

describe('validate-node-config', () => {
  describe('validateNode', () => {
    let getInfoResponse
    let getInfoStub
    let clientStub
    let currencyConfig
    let engine
    let isEngineUnlockedStub
    let genSeedStub
    let walletUnlockerStub
    let validateNodeConfigStub

    let reverts = []

    beforeEach(() => {
      getInfoResponse = { chains: [ 'bitcoin' ] }
      getInfoStub = sinon.stub().returns(getInfoResponse)
      genSeedStub = sinon.stub().resolves()
      isEngineUnlockedStub = sinon.stub().resolves(true)
      validateNodeConfigStub = sinon.stub()

      reverts.push(validateNode.__set__('getInfo', getInfoStub))
      reverts.push(validateNode.__set__('genSeed', genSeedStub))
      reverts.push(validateNode.__set__('isEngineUnlocked', isEngineUnlockedStub))
      reverts.push(validateNode.__set__('validateNodeConfig', validateNodeConfigStub))

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
      beforeEach(async () => {
        isEngineUnlockedStub.resolves(true)
        await validateNode.call(engine)
      })

      it('validates the current nodes config', () => {
        expect(validateNodeConfigStub).to.have.been.called()
      })
    })

    context('engine is not unlocked', () => {
      beforeEach(() => {
        isEngineUnlockedStub.resolves(false)
      })

      it('does not attempt to make a Lightning rpc call', async () => {
        await validateNode.call(engine)
        expect(getInfoStub).to.not.have.been.called()
      })

      it('makes a call to WalletUnlocked rpc to check if the daemon is accessible', async () => {
        await validateNode.call(engine)
        expect(genSeedStub).to.have.been.calledWith({ client: walletUnlockerStub })
      })

      it('returns true if configuration matches', async () => {
        expect(await validateNode.call(engine)).to.be.eql(true)
      })

      it('throws an error if the genseed call has failed', () => {
        genSeedStub.throws()
        return expect(validateNode.call(engine)).to.eventually.be.rejectedWith('Call to validate an unlocked engine')
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

      revert = validateNode.__set__('getInfo', getInfoStub)
    })

    beforeEach(() => {
      isEngineUnlocked = validateNode.__get__('isEngineUnlocked')
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
