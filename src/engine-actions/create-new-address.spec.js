const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createNewAddress = rewire(path.resolve(__dirname, 'create-new-address'))

describe('createNewAddress', () => {
  let newAddressStub
  let clientStub
  let addressResponse
  let res
  let nestedWitnessType

  beforeEach(() => {
    nestedWitnessType = 1
    addressResponse = '1234'
    newAddressStub = sinon.stub().returns(addressResponse)
    clientStub = sinon.stub()

    createNewAddress.__set__('newAddress', newAddressStub)
    createNewAddress.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await createNewAddress()
  })

  it('creates a new address through lnd', () => {
    expect(newAddressStub).to.have.been.calledWith(nestedWitnessType, { client: clientStub })
  })

  it('returns a wallet address', () => {
    expect(res).to.be.eql(addressResponse)
  })
})
