const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const info = rewire(path.resolve(__dirname, 'info'))

describe('info', () => {
  describe('publicKey', () => {
    let pubKey
    let clientStub
    let getInfoStub
    let logger
    let publicKey

    beforeEach(() => {
      pubKey = '1234'
      getInfoStub = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        getInfo: getInfoStub
      }
      info.__set__('client', clientStub)
      info.__set__('logger', logger)
      publicKey = info.publicKey
    })

    it('makes a call to getInfo', () => {
      publicKey()
      expect(getInfoStub).to.have.been.calledOnce()
    })

    it('returns a public key', async () => {
      getInfoStub.yields(null, { identityPubkey: pubKey })
      const res = await publicKey()
      expect(res).to.eql(pubKey)
    })

    it('rejects if lnd throws an error', () => {
      getInfoStub.yields(new Error('Bad'))
      return expect(publicKey()).to.be.rejectedWith(Error)
    })
  })
})
