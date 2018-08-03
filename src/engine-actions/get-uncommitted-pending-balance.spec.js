const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getUncommittedPendingBalance = rewire(path.resolve(__dirname, 'get-uncommitted-pending-balance'))

describe('getUncommittedPendingBalance', () => {
  let listPendingChannelsStub
  let logger
  let pendingClosingChannels
  let pendingForceClosingChannels
  let waitingCloseChannels
  let unconfirmedBalance
  let balanceResponse
  let walletBalanceStub

  beforeEach(() => {
    pendingClosingChannels = [
      { channel: { localBalance: '10' } },
      { channel: { localBalance: '1000' } }
    ]
    pendingForceClosingChannels = [{ channel: { localBalance: '30' } }]
    waitingCloseChannels = []

    logger = {
      debug: sinon.stub()
    }
    unconfirmedBalance = '1234'
    balanceResponse = { unconfirmedBalance }
    walletBalanceStub = sinon.stub().returns(balanceResponse)
    listPendingChannelsStub = sinon.stub().resolves({pendingClosingChannels, pendingForceClosingChannels, waitingCloseChannels})
    getUncommittedPendingBalance.__set__('walletBalance', walletBalanceStub)
    getUncommittedPendingBalance.__set__('logger', logger)
  })

  it('returns 0 if no channels exist', async () => {
    listPendingChannelsStub = sinon.stub().returns({})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('1234')
  })

  it('returns the total pending close channel balance combined with unconfirmed wallet balance', async () => {
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('2274')
  })
})
