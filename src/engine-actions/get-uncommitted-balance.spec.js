const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getUncommittedBalance = rewire(path.resolve(__dirname, 'get-uncommitted-balance'))

describe('getUncommittedBalance', () => {
  let walletBalanceStub
  let clientStub
  let balanceResponse
  let confirmedBalance
  let res

  beforeEach(() => {
    confirmedBalance = '1234'
    balanceResponse = { confirmedBalance }
    walletBalanceStub = sinon.stub().returns(balanceResponse)
    clientStub = sinon.stub()

    getUncommittedBalance.__set__('walletBalance', walletBalanceStub)
    getUncommittedBalance.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getUncommittedBalance()
  })

  it('gets a wallet balance', () => {
    expect(walletBalanceStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the totalBalance', () => {
    expect(res).to.be.eql(confirmedBalance)
  })
})
