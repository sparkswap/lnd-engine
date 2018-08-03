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

  it('returns 0 if no unconfirmed balance and no channels exist', async () => {
    listPendingChannelsStub.resolves({})
    walletBalanceStub.resolves({unconfirmedBalance: '0'})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('0')
  })

  it('returns the unconfirmed balance if no channels exist', async () => {
    listPendingChannelsStub = sinon.stub().resolves({})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('1234')
  })

  it('adds pendingClosingChannels to the unconfirmed balance if the pendingClosingChannels exist', async () => {
    listPendingChannelsStub.resolves({pendingClosingChannels})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('2244')
  })

  it('adds pendingClosingChannels and pendingForceClosingChannels to the unconfirmed balance if the channels exist', async () => {
    listPendingChannelsStub.resolves({pendingClosingChannels, pendingForceClosingChannels})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('2274')
  })

  it('adds pendingClosingChannels, pendingForceClosingChannels,and waitingCloseChannels to the unconfirmed balance if the channels exist', async () => {
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('2274')
  })
})
