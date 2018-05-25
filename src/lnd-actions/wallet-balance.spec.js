const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const balance = rewire(path.resolve(__dirname, 'balance'))

describe('balance', () => {
  describe('wallet-balance', () => {
    let walletBalance
    let walletBalanceStub
    let client

    beforeEach(() => {
      walletBalanceStub = sinon.stub()
      client = {
        walletBalance: walletBalanceStub
      }
      balance.__set__('client', client)
      walletBalance = balance.__get__('walletBalance')
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

})
