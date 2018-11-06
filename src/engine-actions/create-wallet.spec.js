const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createWallet = rewire(path.resolve(__dirname, 'create-wallet'))

describe('createSwapHash', () => {
  let genSeedStub
  let initWalletStub
  let seed

  beforeEach(() => {
    seed = {
      cipherSeedMnuemonic: ['bird', 'cat']
    }
    genSeedStub = sinon.stub().returns(seed)

    createWallet.__set__('genSeed', genSeedStub)
    createWallet.__set__('initWallet', initWalletStub)
  })

  it('generates a wallet seed', () => {

  })

  it('initializes a wallet', () => {
    expect(initWalletStub).to.have.been.calledWith()
  })
})
