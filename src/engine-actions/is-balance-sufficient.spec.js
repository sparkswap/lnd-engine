const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isBalanceSufficient = rewire(path.resolve(__dirname, 'is-balance-sufficient'))

describe('isBalanceSufficient', () => {
  let value
  let outbound
  let listChannelsStub
  let clientStub
  let channels
  let publicKey
  let destinationHost
  let revertListChannelsStub
  let networkAddressStub
  let paymentChannelNetworkAddress

  beforeEach(() => {
    publicKey = 'asdf1234'
    destinationHost = '127.0.0.1'
    paymentChannelNetworkAddress = `bolt:${publicKey}@${destinationHost}`
    value = '100'
    outbound = true
    clientStub = sinon.stub()
    networkAddressStub = {
      parse: sinon.stub().returns({ publicKey: publicKey, host: destinationHost })
    }
    isBalanceSufficient.__set__('client', clientStub)
    isBalanceSufficient.__set__('networkAddressFormatter', networkAddressStub)
  })

  afterEach(() => {
    revertListChannelsStub()
  })

  it('looks up the invoice by invoice hash', async () => {
    channels = [{active: true, localBalance: '10', emoteBalance: '100', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(listChannelsStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns false if there are no channels with the remotePubkey', async () => {
    const newChannels = [{active: true, localBalance: '10', remoteBalance: '100', remotePubkey: 'banana'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns false if the localBalance for the outbound channel is not sufficient', async () => {
    const newChannels = [{active: true, localBalance: '10', remoteBalance: '100', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns true if the localBalance for the outbound channel is sufficient', async () => {
    const newChannels = [{active: true, localBalance: '100', remoteBalance: '100', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if the remoteBalance for the inbound channel is sufficient', async () => {
    const newChannels = [{active: true, localBalance: '100', remoteBalance: '10', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound: false })
    expect(res).to.be.eql(false)
  })

  it('returns true if the remoteBalance for the inbound channel is sufficient', async () => {
    const newChannels = [{active: true, localBalance: '100', remoteBalance: '100', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound: false })
    expect(res).to.be.eql(true)
  })

  it('returns false if a valid channel is not active', async () => {
    const newChannels = [{active: false, localBalance: '100', remoteBalance: '100', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound: false })
    expect(res).to.be.eql(false)
  })

  it('returns true if any channels with the publicKey key have sufficient funds', async () => {
    const newChannels = [
      {active: true, localBalance: '10', remoteBalance: '10', remotePubkey: publicKey},
      {active: true, localBalance: '100', remoteBalance: '10', remotePubkey: publicKey}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if none of the channels with the publicKey key have sufficient funds', async () => {
    const newChannels = [
      {active: true, localBalance: '10', remoteBalance: '10', remotePubkey: publicKey},
      {active: true, localBalance: '10', remoteBalance: '10', remotePubkey: publicKey}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns true if none of the channels with the publicKey key have sufficient funds', async () => {
    const newChannels = [
      {active: true, localBalance: '10', remoteBalance: '10', remotePubkey: 'banana'},
      {active: true, localBalance: '100', remoteBalance: '10', remotePubkey: publicKey}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if none of the channels with the publicKey key have sufficient funds', async () => {
    const newChannels = [
      {active: true, localBalance: '100', remoteBalance: '10', remotePubkey: 'banana'},
      {active: true, localBalance: '10', remoteBalance: '10', remotePubkey: publicKey}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('defaults to check the outbound channel', async () => {
    const newChannels = [{active: true, localBalance: '100', remoteBalance: '10', remotePubkey: publicKey}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(paymentChannelNetworkAddress, value)
    expect(res).to.be.eql(true)
  })
})
