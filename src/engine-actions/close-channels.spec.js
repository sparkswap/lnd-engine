const path = require('path')
const { expect, rewire, sinon, delay } = require('test/test-helper')

const closeChannels = rewire(path.resolve(__dirname, 'close-channels'))

describe('closeChannels', () => {
  let clientStub
  let engine
  let closeChannelStub
  let logger
  let listChannelsStub
  let channels
  let closeChannelStream
  let channel
  let channelInfo

  function streamReturnsClosedChannel (stream, channelInfo) {
    stream.on.withArgs('data').callsFake(async (evt, listener) => {
      await delay(10)
      listener(channelInfo)
    })
  }

  function streamErrors (stream, error) {
    stream.on.withArgs('error').callsFake(async (evt, listener) => {
      await delay(10)
      listener(error)
    })
  }

  function streamCloses (stream) {
    stream.on.withArgs('end').callsFake(async (evt, listener) => {
      await delay(10)
      listener()
    })
  }

  beforeEach(() => {
    closeChannelStream = {
      on: sinon.stub(),
      removeListener: sinon.stub()
    }
    channel = {active: true, channelPoint: 'asdf:1234'}
    channels = [channel]
    closeChannelStub = sinon.stub().returns(closeChannelStream)
    listChannelsStub = sinon.stub().resolves({channels})
    clientStub = sinon.stub()
    logger = {
      debug: sinon.stub(),
      error: sinon.stub(),
      info: sinon.stub()
    }
    engine = {
      logger,
      client: clientStub
    }
    channelInfo = {
      close_pending: 'PendingUpdate',
      confirmation: 'ConfirmationUpdate',
      chan_close: 'ChannelCloseUpdate'
    }
    closeChannels.__set__('closeChannel', closeChannelStub)
    closeChannels.__set__('listChannels', listChannelsStub)
    closeChannels.__set__('logger', logger)
  })

  it('returns an empty array if no channels exist', async () => {
    listChannelsStub = sinon.stub().resolves({})
    closeChannels.__set__('listChannels', listChannelsStub)
    const res = await closeChannels()
    expect(logger.debug).to.have.been.calledWith('closeChannels: No channels exist')
    return expect(res).to.be.eql([])
  })

  it('returns an empty array if no active channels exist', async () => {
    listChannelsStub = sinon.stub().resolves({channels: [{active: false}]})
    closeChannels.__set__('listChannels', listChannelsStub)
    const res = await closeChannels()
    expect(logger.debug).to.have.been.calledWith('closeChannels: No active channels exist')
    return expect(res).to.be.eql([])
  })

  it('closes channels on the engine', async () => {
    streamReturnsClosedChannel(closeChannelStream, [ channel ])
    await closeChannels.call(engine)

    expect(closeChannelStub).to.have.been.calledOnce()
    expect(closeChannelStub).to.have.been.calledWith({ fundingTxidStr: 'asdf', outputIndex: 1234 }, false, { client: clientStub })
  })

  it('returns info about closed channels on the engine', async () => {
    streamReturnsClosedChannel(closeChannelStream, channelInfo)
    const res = await closeChannels.call(engine)
    expect(res).to.eql([channelInfo])
  })

  it('throws if the stream errors', () => {
    streamErrors(closeChannelStream, new Error('Error from closeChannel stream'))

    return expect(closeChannels.call(engine)).to.eventually.be.rejectedWith('Error from closeChannel stream')
  })

  it('throws if the stream closes early', () => {
    streamCloses(closeChannelStream)

    return expect(closeChannels.call(engine)).to.eventually.be.rejectedWith('LND closed closeChannel stream before returning our value')
  })

  it('removes listeners', async () => {
    streamReturnsClosedChannel(closeChannelStream, channel)
    await closeChannels.call(engine)
    const dataListener = closeChannelStream.on.withArgs('data').args[0][1]
    const endListener = closeChannelStream.on.withArgs('end').args[0][1]
    const errorListener = closeChannelStream.on.withArgs('error').args[0][1]

    expect(closeChannelStream.removeListener).to.have.been.calledThrice()
    expect(closeChannelStream.removeListener).to.have.been.calledWith('data', dataListener)
    expect(closeChannelStream.removeListener).to.have.been.calledWith('end', endListener)
    expect(closeChannelStream.removeListener).to.have.been.calledWith('error', errorListener)
  })
})
