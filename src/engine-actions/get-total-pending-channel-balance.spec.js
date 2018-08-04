const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalPendingChannelBalance = rewire(path.resolve(__dirname, 'get-total-pending-channel-balance'))

describe('getTotalPendingChannelBalance', () => {
  let pendingOpenChannels
  let listPendingChannelsStub
  let logger

  beforeEach(() => {
    pendingOpenChannels = [
      { channel: { localBalance: '10' } },
      { channel: { localBalance: '1000' } }
    ]

    logger = {
      debug: sinon.stub()
    }

    getTotalPendingChannelBalance.__set__('logger', logger)
  })

  it('returns 0 if no channels exist', async () => {
    listPendingChannelsStub = sinon.stub().returns({})
    getTotalPendingChannelBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getTotalPendingChannelBalance()).to.be.eql('0')
  })

  it('returns the total balance of all channels on a daemon', async () => {
    listPendingChannelsStub = sinon.stub().returns({ pendingOpenChannels })
    getTotalPendingChannelBalance.__set__('listPendingChannels', listPendingChannelsStub)
    return expect(await getTotalPendingChannelBalance()).to.be.eql('1010')
  })
})
