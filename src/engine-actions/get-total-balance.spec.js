const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalBalance = rewire(path.resolve(__dirname, 'get-total-balance'))

describe('getTotalBalance', () => {
  let walletBalanceStub
  let clientStub
  let balanceResponse
  let totalBalance
  let res

  beforeEach(() => {
    totalBalance = '1234'
    balanceResponse = { totalBalance }
    walletBalanceStub = sinon.stub().returns(balanceResponse)
    clientStub = sinon.stub()

    getTotalBalance.__set__('walletBalance', walletBalanceStub)
    getTotalBalance.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getTotalBalance()
  })

  it('gets a wallet balance', () => {
    expect(walletBalanceStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the totalBalance', () => {
    expect(res).to.be.eql(totalBalance)
  })
})
