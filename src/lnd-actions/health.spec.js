const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const health = rewire(path.resolve(__dirname, 'health'))

describe('health', () => {
  describe('isOK', () => {
    let clientStub
    let getInfoStub
    let logger
    let isOK

    beforeEach(() => {
      getInfoStub = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        getInfo: getInfoStub
      }
      health.__set__('client', clientStub)
      health.__set__('logger', logger)
      isOK = health.isOK
    })

    it('makes a call to getInfo to check connectivity', () => {
      isOK()
      expect(getInfoStub).to.have.been.calledOnce()
    })

    it('returns true is call was successful', async () => {
      getInfoStub.yields(null, {})
      const res = await isOK()
      expect(res).to.be.true()
    })

    it('rejects if lnd throws an error', () => {
      getInfoStub.yields(new Error('Bad'))
      return expect(isOK()).to.be.rejectedWith(Error)
    })
  })
})
