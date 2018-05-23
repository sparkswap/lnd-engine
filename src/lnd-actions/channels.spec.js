const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const channels = rewire(path.resolve(__dirname, 'channels'))

describe('channels', () => {
  describe('open', () => {
    let publicKey
    let fundingAmount
    let clientStub
    let openChannelSyncStub
    let logger
    let open
    let expectedResponse

    beforeEach(() => {
      publicKey = '1234'
      fundingAmount = '100'
      openChannelSyncStub = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        openChannelSync: openChannelSyncStub
      }
      channels.__set__('client', clientStub)
      channels.__set__('logger', logger)
      open = channels.open
    })

    it('makes a call to openChannelSync with public key and funding amount', () => {
      open(publicKey, fundingAmount)
      expect(openChannelSyncStub).to.have.been.calledOnce()
      expect(openChannelSyncStub).to.have.been.calledWith(sinon.match({
        nodePubKey: publicKey,
        localFundingAmount: fundingAmount
      }))
    })

    it('returns an output', async () => {
      expectedResponse = { outputIndex: 'TESTOUTPUTINDEX' }
      openChannelSyncStub.yields(null, expectedResponse)
      const res = await open(publicKey, fundingAmount)
      expect(res).to.eql(expectedResponse.outputIndex)
    })

    it('rejects if lnd throws an error', () => {
      openChannelSyncStub.yields(new Error('Bad'))
      return expect(open(publicKey, fundingAmount)).to.be.rejectedWith(Error)
    })
  })
})
