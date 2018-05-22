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

  describe('total', () => {
    let total
    let walletBalanceStub
    let totalBalance

    beforeEach(() => {
      totalBalance = '100'
      walletBalanceStub = sinon.stub().returns({ totalBalance })
      balance.__set__('walletBalance', walletBalanceStub)
      total = balance.total
    })

    it('calls wallet balance', async () => {
      await total()
      expect(walletBalanceStub).to.have.been.called()
    })

    it('returns the total balance', async () => {
      const res = await total()
      expect(res).to.eql(totalBalance)
    })
  })

  describe('unconfirmed', () => {
    let unconfirmed
    let walletBalanceStub
    let unconfirmedBalance

    beforeEach(() => {
      unconfirmedBalance = '100'
      walletBalanceStub = sinon.stub().returns({ unconfirmedBalance })
      balance.__set__('walletBalance', walletBalanceStub)
      unconfirmed = balance.unconfirmed
    })

    it('calls wallet balance', async () => {
      await unconfirmed()
      expect(walletBalanceStub).to.have.been.called()
    })

    it('returns the unconfirmed balance', async () => {
      const res = await unconfirmed()
      expect(res).to.eql(unconfirmedBalance)
    })
  })

  describe('confirmed', () => {
    let confirmed
    let walletBalanceStub
    let confirmedBalance

    beforeEach(() => {
      confirmedBalance = '100'
      walletBalanceStub = sinon.stub().returns({ confirmedBalance })
      balance.__set__('walletBalance', walletBalanceStub)
      confirmed = balance.confirmed
    })

    it('calls wallet balance', async () => {
      await confirmed()
      expect(walletBalanceStub).to.have.been.called()
    })

    it('returns the confirmed balance', async () => {
      const res = await confirmed()
      expect(res).to.eql(confirmedBalance)
    })
  })
})
