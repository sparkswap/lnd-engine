const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isBalanceSufficient = rewire(path.resolve(__dirname, 'is-balance-sufficient'))

describe('isBalanceSufficient', () => {
  let value
  let outbound
  let listChannelsStub
  let clientStub
  let channels
  let destination
  let revertListChannelsStub

  beforeEach(() => {
    destination = 'asdf'
    value = 100
    outbound = true
    clientStub = sinon.stub()
    isBalanceSufficient.__set__('client', clientStub)
  })

  afterEach(() => {
    revertListChannelsStub()
  })

  it('looks up the invoice by invoice hash', async () => {
    channels = [{localBalance: 10, remoteBalance: 100, remotePubkey: destination}]
    listChannelsStub = sinon.stub().resolves({ channels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    await isBalanceSufficient(destination, value, { outbound })
    expect(listChannelsStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns false if there are no channels with the remotePubkey', async () => {
    const newChannels = [{localBalance: 10, remoteBalance: 100, remotePubkey: 'banana'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns false if the localBalance for the outbound channel is not sufficient', async () => {
    const newChannels = [{localBalance: 10, remoteBalance: 100, remotePubkey: 'asdf'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns true if the localBalance for the outbound channel is sufficient', async () => {
    const newChannels = [{localBalance: 100, remoteBalance: 100, remotePubkey: 'asdf'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if the remoteBalance for the inbound channel is sufficient', async () => {
    const newChannels = [{localBalance: 100, remoteBalance: 10, remotePubkey: 'asdf'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound: false })
    expect(res).to.be.eql(false)
  })

  it('returns true if the remoteBalance for the inbound channel is sufficient', async () => {
    const newChannels = [{localBalance: 100, remoteBalance: 100, remotePubkey: 'asdf'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound: false })
    expect(res).to.be.eql(true)
  })

  it('returns true if any channels with the destination key have sufficient funds', async () => {
    const newChannels = [
      {localBalance: 10, remoteBalance: 10, remotePubkey: 'asdf'},
      {localBalance: 100, remoteBalance: 10, remotePubkey: 'asdf'}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if none of the channels with the destination key have sufficient funds', async () => {
    const newChannels = [
      {localBalance: 10, remoteBalance: 10, remotePubkey: 'asdf'},
      {localBalance: 10, remoteBalance: 10, remotePubkey: 'asdf'}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('returns true if none of the channels with the destination key have sufficient funds', async () => {
    const newChannels = [
      {localBalance: 10, remoteBalance: 10, remotePubkey: 'banana'},
      {localBalance: 100, remoteBalance: 10, remotePubkey: 'asdf'}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(true)
  })

  it('returns false if none of the channels with the destination key have sufficient funds', async () => {
    const newChannels = [
      {localBalance: 100, remoteBalance: 10, remotePubkey: 'banana'},
      {localBalance: 10, remoteBalance: 10, remotePubkey: 'asdf'}
    ]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)
    const res = await isBalanceSufficient(destination, value, { outbound })
    expect(res).to.be.eql(false)
  })

  it('defaults to check the outbound channel', async () => {
    const newChannels = [{localBalance: 100, remoteBalance: 10, remotePubkey: 'asdf'}]
    listChannelsStub = sinon.stub().resolves({ channels: newChannels })
    revertListChannelsStub = isBalanceSufficient.__set__('listChannels', listChannelsStub)

    const res = await isBalanceSufficient(destination, value)
    expect(res).to.be.eql(true)
  })
})
