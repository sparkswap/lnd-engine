const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getNetwork = rewire(path.resolve(__dirname, 'get-network'))

describe('getPublicKey', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let res

  beforeEach(() => {
    getInfoResponse = {
      chains: [{
        chain: 'bitcoin',
        network: 'mainnet'
      }]
    }
    getInfoStub = sinon.stub().returns(getInfoResponse)
    clientStub = sinon.stub()

    getNetwork.__set__('getInfo', getInfoStub)
    getNetwork.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getNetwork()
  })

  it('gets info on a specified lnd instance', () => {
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('throws if there are more than one chain', () => {
    getInfoResponse = {
      chains: [
        {
          chain: 'bitcoin',
          network: 'mainnet'
        },
        {
          chain: 'litecoin',
          network: 'mainnet'
        }
      ]
    }
    getInfoStub = sinon.stub().resolves(getInfoResponse)
    const revert = getNetwork.__set__('getInfo', getInfoStub)

    expect(getNetwork()).to.eventually.be.rejectedWith('Cannot grab network from multiple chains.')
    revert()
  })

  it('returns the identity_publickey', () => {
    expect(res).to.be.eql('mainnet')
  })
})
