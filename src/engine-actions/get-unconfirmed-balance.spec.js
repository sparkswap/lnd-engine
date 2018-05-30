const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getUnconfirmedBalance = rewire(path.resolve(__dirname, 'get-unconfirmed-balance'))

describe('getUnconfirmedBalance', () => {
  let walletBalanceStub
  let clientStub
  let balanceResponse
  let unconfirmedBalance
  let res

  beforeEach(() => {
    unconfirmedBalance = '1234'
    balanceResponse = { unconfirmedBalance }
    walletBalanceStub = sinon.stub().returns(balanceResponse)
    clientStub = sinon.stub()

    getUnconfirmedBalance.__set__('walletBalance', walletBalanceStub)
    getUnconfirmedBalance.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getUnconfirmedBalance()
  })

  it('gets a wallet balance', () => {
    expect(walletBalanceStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns an unconfirmedBalance', () => {
    expect(res).to.be.eql(unconfirmedBalance)
  })
})
