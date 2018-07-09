const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPaymentChannelNetworkAddress = rewire(path.resolve(__dirname, 'get-payment-channel-network-address'))

describe('getPaymentChannelNetworkAddress', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let engine
  let res

  beforeEach(() => {
    getInfoResponse = { uris: [ '1234@localhost:100789' ] }
    getInfoStub = sinon.stub().returns(getInfoResponse)
    clientStub = sinon.stub()

    engine = { client: clientStub }

    getPaymentChannelNetworkAddress.__set__('getInfo', getInfoStub)
  })

  beforeEach(async () => {
    res = await getPaymentChannelNetworkAddress.call(engine)
  })

  it('gets info on a specified lnd instance', () => {
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the formatted network address', () => {
    expect(res).to.be.eql('bolt:1234@localhost:100789')
  })

  it('excludes the host if required', async () => {
    res = await getPaymentChannelNetworkAddress.call(engine, { includeHost: false })

    expect(res).to.be.eql('bolt:1234')
  })
})
