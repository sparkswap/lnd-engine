const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const unlockWallet = rewire(path.resolve(__dirname, 'unlock-wallet'))

describe('unlock-wallet', () => {
  const walletPassword = 'mypassword'

  let lndUnlockWalletStub
  let engine

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub
    }
    lndUnlockWalletStub = sinon.stub()
    unlockWallet.__set__('lndUnlockWallet', lndUnlockWalletStub)
  })

  beforeEach(async () => {
    await unlockWallet.call(engine, walletPassword)
  })

  it('unlocks a wallet', () => {
    expect(lndUnlockWalletStub).to.have.been.calledWith(walletPassword, { client: engine.walletUnlocker })
  })
})
