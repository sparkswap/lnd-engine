const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalReservedChannelBalance = rewire(path.resolve(__dirname, 'get-total-reserved-channel-balance'))

describe('get-total-reserved-channel-balance', () => {
  describe('getTotalReservedChannelBalance', () => {
    let channels
    let listChannelsStub
    let logger

    beforeEach(() => {
      channels = [
        { initiator: true, commitFee: '10' },
        { initiator: true, commitFee: '1000' },
        { initiator: false, commitFee: '1000' }
      ]

      logger = {
        debug: sinon.stub()
      }

      getTotalReservedChannelBalance.__set__('logger', logger)
    })

    it('returns 0 if no channels exist', async () => {
      listChannelsStub = sinon.stub().returns({})
      getTotalReservedChannelBalance.__set__('listChannels', listChannelsStub)
      return expect(await getTotalReservedChannelBalance()).to.be.eql('0')
    })

    it('returns 0 if no channels were initiator', async () => {
      const channels = [
        { initiator: false, commitFee: 10 },
        { initiator: false, commitFee: 1000 }
      ]

      listChannelsStub = sinon.stub().returns({ channels })
      getTotalReservedChannelBalance.__set__('listChannels', listChannelsStub)
      return expect(await getTotalReservedChannelBalance()).to.be.eql('0')
    })

    it('returns the total reserved channel balance of all channels that were initiator', async () => {
      listChannelsStub = sinon.stub().returns({ channels })
      getTotalReservedChannelBalance.__set__('listChannels', listChannelsStub)
      return expect(await getTotalReservedChannelBalance()).to.be.eql('1010')
    })
  })
})
