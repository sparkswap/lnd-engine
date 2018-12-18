const grpc = require('grpc')
const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve(__dirname, '..', 'index'))
const getStatus = rewire(path.resolve(__dirname, 'get-status'))

describe('get-status', () => {
  describe('getStatus', () => {
    let reverts = []

    let engine
    let getInfoStub
    let genSeedStub
    let getInfoResponse
    let statuses

    beforeEach(() => {
      getInfoResponse = {
        chains: ['testnet']
      }
      getInfoStub = sinon.stub().resolves(getInfoResponse)
      genSeedStub = sinon.stub().resolves(true)
      statuses = LndEngine.__get__('ENGINE_STATUSES')
      engine = {
        client: sinon.stub(),
        walletUnlocker: sinon.stub(),
        logger: {
          error: sinon.stub()
        },
        currencyConfig: {
          chainName: 'testnet'
        }
      }

      reverts.push(getStatus.__set__('getInfo', getInfoStub))
      reverts.push(getStatus.__set__('genSeed', genSeedStub))
    })

    afterEach(() => {
      reverts.forEach(r => r())
    })

    context('engine is valid', () => {
      it('returns VALIDATED if the lnd engine is valid', async () => {
        expect(await getStatus.call(engine)).to.be.eql(statuses.VALIDATED)
      })
    })

    context('engines wallet needs to be created', () => {
      it('if getInfo rejects with UNIMPLEMENTED AND genSeed is a successful call', async () => {
        const error = new Error('Something Happened')
        error.code = grpc.status.UNIMPLEMENTED
        getInfoStub.rejects(error)
        expect(await getStatus.call(engine)).to.be.eql(statuses.NEEDS_WALLET)
      })
    })

    context('engine is unlocked', () => {
      it('returns UNLOCKED if getInfo returns a blank response', async () => {
        getInfoStub.resolves({})
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNLOCKED)
      })
    })

    context('engine is locked', () => {
      it('if getInfo rejects with UNIMPLEMENTED AND genSeed rejects with `wallet exists`', async () => {
        const error = new Error('Something Happened')
        error.code = grpc.status.UNIMPLEMENTED
        getInfoStub.rejects(error)
        const WALLET_EXISTS_ERROR_MESSAGE = getStatus.__get__('WALLET_EXISTS_ERROR_MESSAGE')
        const walletExistsError = new Error(WALLET_EXISTS_ERROR_MESSAGE)
        genSeedStub.rejects(walletExistsError)
        expect(await getStatus.call(engine)).to.be.eql(statuses.LOCKED)
      })
    })

    context('engine is unavailable', () => {
      it('if getInfo returns a real error (non-unimplemented)', async () => {
        const error = new Error('Something Happened')
        error.code = 2
        getInfoStub.rejects(error)
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNAVAILABLE)
      })

      it('if getInfo rejects with UNIMPLEMENTED AND genSeed reject with real errors', async () => {
        const error = new Error('Something Happened')
        error.code = grpc.status.UNIMPLEMENTED
        getInfoStub.rejects(error)
        const walletExistsError = new Error('Something else happened')
        genSeedStub.rejects(walletExistsError)
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNAVAILABLE)
      })
    })

    context('engine is unlocked', () => {
      it('returns UNLOCKED if getInfo returns a blank response', async () => {
        getInfoStub.resolves({})
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNLOCKED)
      })

      it('returns UNLOCKED if getInfo returns more than one chain', async () => {
        getInfoStub.resolves({ chains: ['testnet', 'mainnet'] })
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNLOCKED)
      })

      it('returns UNLOCKED if chain names do not match', async () => {
        getInfoStub.resolves({ chains: ['badnet'] })
        expect(await getStatus.call(engine)).to.be.eql(statuses.UNLOCKED)
      })
    })
  })
})
