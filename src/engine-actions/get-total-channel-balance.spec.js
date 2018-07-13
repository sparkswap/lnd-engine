const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalChannelBalance = rewire(path.resolve(__dirname, 'get-total-channel-balance'))

describe('get-total-channel-balance', () => {
  describe('getTotalChannelBalance', () => {
    let channels
    let listChannelsStub
    let logger

    beforeEach(() => {
      channels = [
        { localBalance: '10' },
        { localBalance: '1000' }
      ]

      logger = {
        debug: sinon.stub()
      }

      getTotalChannelBalance.__set__('logger', logger)
    })

    it('returns 0 if no channels exist', async () => {
      listChannelsStub = sinon.stub().returns({})
      getTotalChannelBalance.__set__('listChannels', listChannelsStub)
      return expect(await getTotalChannelBalance()).to.be.eql('0')
    })

    it('returns the total balance of all channels on a daemon', async () => {
      listChannelsStub = sinon.stub().returns({ channels })
      getTotalChannelBalance.__set__('listChannels', listChannelsStub)
      return expect(await getTotalChannelBalance()).to.be.eql('1010')
    })
  })
})
