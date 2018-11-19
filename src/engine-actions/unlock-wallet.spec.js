const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const unlockWallet = rewire(path.resolve(__dirname, 'unlock-wallet'))

describe('unlock-wallet', () => {
  const walletPassword = 'mypassword'

  let lndUnlockWalletStub
  let engine
  let bufferStub
  let buffer

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub
    }
    buffer = sinon.stub()
    bufferStub = {
      from: sinon.stub().returns(buffer)
    }
    lndUnlockWalletStub = sinon.stub()

    unlockWallet.__set__('lndUnlockWallet', lndUnlockWalletStub)
    unlockWallet.__set__('Buffer', bufferStub)
  })

  beforeEach(async () => {
    await unlockWallet.call(engine, walletPassword)
  })

  it('converts a string to buffer', () => {
    expect(bufferStub.from).to.have.been.calledWith(walletPassword, sinon.match.any)
  })

  it('unlocks a wallet', () => {
    expect(lndUnlockWalletStub).to.have.been.calledWith(buffer, { client: engine.walletUnlocker })
  })
})
