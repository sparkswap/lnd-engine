const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getUncommittedPendingBalance = rewire(path.resolve(__dirname, 'get-uncommitted-pending-balance'))

describe('getUncommittedPendingBalance', () => {
  let listPendingChannelsStub
  let logger
  let pendingForceClosingChannels
  let unconfirmedBalance
  let balanceResponse
  let walletBalanceStub

  beforeEach(() => {
    pendingForceClosingChannels = [{ channel: { localBalance: '30' } }]

    logger = {
      debug: sinon.stub()
    }
    unconfirmedBalance = '1234'
    balanceResponse = { unconfirmedBalance }
    walletBalanceStub = sinon.stub().returns(balanceResponse)
    listPendingChannelsStub = sinon.stub().resolves({ pendingForceClosingChannels })
    getUncommittedPendingBalance.__set__('walletBalance', walletBalanceStub)
    getUncommittedPendingBalance.__set__('logger', logger)
  })

  it('returns 0 if no unconfirmed balance and no channels exist', async () => {
    listPendingChannelsStub.resolves({})
    walletBalanceStub.resolves({ unconfirmedBalance: '0' })
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('0')
  })

  it('returns the unconfirmed balance if no channels exist', async () => {
    listPendingChannelsStub = sinon.stub().resolves({})
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('1234')
  })

  it('adds pendingForceClosingChannels to the unconfirmed balance if the channels exist', async () => {
    listPendingChannelsStub.resolves({ pendingForceClosingChannels })
    getUncommittedPendingBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getUncommittedPendingBalance()).to.be.eql('1264')
  })
})
