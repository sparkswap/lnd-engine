const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const newAddress = rewire(path.resolve(__dirname, 'new-address'))

describe('wallet', () => {
  describe('new-address', () => {
    let newAddressStub
    let client

    beforeEach(() => {
      newAddressStub = sinon.stub()
      client = {
        newAddress: newAddressStub
      }
      newAddress.__set__('client', client)
    })

    it('makes a call to lnd for wallet balance', () => {
      newAddress()
      const type = newAddress.__get__('DEFAULT_ADDRESS_TYPE')
      expect(newAddressStub).to.have.been.calledOnce()
      expect(newAddressStub).to.have.been.calledWith(sinon.match({ type }))
    })

    it('returns an address from the lnd response', async () => {
      const address = '12345'
      newAddressStub.yields(null, { address })
      const res = await newAddress()
      expect(res).to.eql(address)
    })

    it('handles an exception if wallet balance failed', () => {
      newAddressStub.throws()

      return newAddress().catch(err => {
        expect(err).to.not.be.null()
        expect(err).to.not.be.undefined()
      })
    })
  })
})
