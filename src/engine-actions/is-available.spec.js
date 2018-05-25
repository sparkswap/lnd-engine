const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isAvailable = rewire(path.resolve(__dirname, 'is-available'))

describe('getTotalBalance', () => {
  let getInfoStub
  let clientStub
  let res

  beforeEach(() => {
    getInfoStub = sinon.stub()
    clientStub = sinon.stub()

    isAvailable.__set__('getInfo', getInfoStub)
    isAvailable.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await isAvailable()
  })

  it('makes a call to lnd to see if it succeeds or not', () => {
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns true if the call to getInfo is successful', async () => {
    expect(res).to.be.true()
  })
})
