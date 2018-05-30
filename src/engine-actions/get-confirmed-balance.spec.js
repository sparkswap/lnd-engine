const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getConfirmedBalance = rewire(path.resolve(__dirname, 'get-confirmed-balance'))

describe('getConfirmedBalance', () => {
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

    getConfirmedBalance.__set__('walletBalance', walletBalanceStub)
    getConfirmedBalance.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getConfirmedBalance()
  })

  it('gets an wallet balance', () => {
    expect(walletBalanceStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns a confirmedBalance', () => {
    expect(res).to.be.eql(confirmedBalance)
  })
})
