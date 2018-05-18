const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const walletBalance = rewire(path.resolve(__dirname, 'wallet-balance'))

describe('wallet-balance', () => {
  let walletBalanceStub
  let client

  beforeEach(() => {
    walletBalanceStub = sinon.stub()
    client = {
      walletBalance: walletBalanceStub
    }
    walletBalance.__set__('client', client)
  })

  it('makes a call to lnd for wallet balance', () => {
    walletBalance()
    expect(walletBalanceStub).to.have.been.calledOnce()
  })

  it('handles an exception if wallet balance failed', () => {
    walletBalanceStub.throws()
    return walletBalance().catch(err => {
      expect(err).to.not.be.null()
      expect(err).to.not.be.undefined()
    })
  })
})
