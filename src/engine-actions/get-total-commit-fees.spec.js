const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalCommitFees = rewire(path.resolve(__dirname, 'get-total-commit-fees'))

describe('get-total-channel-balance', () => {
  describe('getTotalChannelBalance', () => {
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

      getTotalCommitFees.__set__('logger', logger)
    })

    it('returns 0 if no channels exist', async () => {
      listChannelsStub = sinon.stub().returns({})
      getTotalCommitFees.__set__('listChannels', listChannelsStub)
      return expect(await getTotalCommitFees()).to.be.eql('0')
    })

    it('returns 0 if no channels were initiator', async () => {
      const channels = [
        { initiator: false, commitFee: 10 },
        { initiator: false, commitFee: 1000 }
      ]

      listChannelsStub = sinon.stub().returns({ channels })
      getTotalCommitFees.__set__('listChannels', listChannelsStub)
      return expect(await getTotalCommitFees()).to.be.eql('0')
    })

    it('returns the total commit fees of all channels that were initiator on a daemon', async () => {
      listChannelsStub = sinon.stub().returns({ channels })
      getTotalCommitFees.__set__('listChannels', listChannelsStub)
      return expect(await getTotalCommitFees()).to.be.eql('1010')
    })
  })
})
