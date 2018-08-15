const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getMaxChannel = rewire(path.resolve(__dirname, 'get-max-channel'))

describe('getMaxChannel', () => {
  let channels
  let listChannelsStub
  let logger

  beforeEach(() => {
    channels = [
      { localBalance: '10', remoteBalance: '300' },
      { localBalance: '0', remoteBalance: '100' },
      { localBalance: '20', remoteBalance: '1000' },
      { localBalance: '10', remoteBalance: '15' }
    ]

    logger = {
      debug: sinon.stub()
    }

    listChannelsStub = sinon.stub().resolves({channels})
    getMaxChannel.__set__('logger', logger)
    getMaxChannel.__set__('listChannels', listChannelsStub)
  })

  it('returns empty if no channels exist', async () => {
    listChannelsStub.resolves({})
    const expectedRes = {}
    const res = await getMaxChannel()
    expect(logger.debug).to.have.been.calledWith('getMaxChannel: No channels exist')
    expect(res).to.eql(expectedRes)
  })

  it('returns max localBalance if outbound is set to true', async () => {
    const expectedRes = { maxBalance: '20' }
    return expect(await getMaxChannel()).to.eql(expectedRes)
  })

  it('returns max remoteBalance if outbound is set to true', async () => {
    const expectedRes = { maxBalance: '1000' }
    return expect(await getMaxChannel({outbound: false})).to.eql(expectedRes)
  })
})
