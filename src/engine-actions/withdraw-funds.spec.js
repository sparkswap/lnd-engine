const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const withdrawFunds = rewire(path.resolve(__dirname, 'withdraw-funds'))

describe('withdrawFunds', () => {
  let sendCoinsStub
  let clientStub
  let addr
  let amount
  let res
  let logger
  let txid

  beforeEach(() => {
    clientStub = sinon.stub()
    addr = 'asdfasdf'
    amount = 20000000
    logger = {
      debug: sinon.stub()
    }

    txid = 'asdfasdfasdfsdf2134'
    sendCoinsStub = sinon.stub().resolves({ txid })
    withdrawFunds.__set__('sendCoins', sendCoinsStub)
    withdrawFunds.__set__('client', clientStub)
    withdrawFunds.__set__('logger', logger)
  })

  it('makes a request to lnd to move coins from lnd wallet to address', async () => {
    res = await withdrawFunds(addr, amount)
    expect(sendCoinsStub).to.have.been.calledWith(addr, amount, { client: clientStub })
  })

  it('returns the transaction id', async () => {
    res = await withdrawFunds(addr, amount)
    expect(res).to.eql(txid)
  })
})
