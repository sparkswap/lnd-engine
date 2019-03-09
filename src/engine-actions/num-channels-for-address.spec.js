const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const numChannelsForAddress = rewire(path.resolve(__dirname, 'num-channels-for-address'))

describe('numChannelsForAddress', () => {
  let getChannelsForAddress
  let channels
  let channel
  let reverts
  let address
  let loggerStub

  beforeEach(() => {
    address = 'bolt:asdf@localhost'
    channel = { remotePubkey: 'asdf' }
    channels = [channel, channel]
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    getChannelsForAddress = sinon.stub().resolves(channels)
    reverts = []
    reverts.push(numChannelsForAddress.__set__('getChannelsForAddress', getChannelsForAddress))
    reverts.push(numChannelsForAddress.__set__('logger', loggerStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('gets all channels for the given address', async () => {
    await numChannelsForAddress(address)
    expect(getChannelsForAddress).to.have.been.called()
    expect(getChannelsForAddress).to.have.been.calledWith(address)
  })

  it('returns the number of active and pending channels for the given pubkey', async () => {
    const res = await numChannelsForAddress(address)
    expect(res).to.eql(2)
  })
})
