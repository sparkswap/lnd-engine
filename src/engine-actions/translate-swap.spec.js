const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const translateSwap = rewire(path.resolve(__dirname, 'translate-swap'))

describe('translate-swap', () => {
  describe('calculateTimeLock', () => {
    let extendedTimeLockDelta
    let secondsPerBlock
    let blockHeight
    let calculateTimeLock

    beforeEach(() => {
      calculateTimeLock = translateSwap.__get__('calculateTimeLock')
      extendedTimeLockDelta = '146400'
      secondsPerBlock = 600
      blockHeight = 100
    })

    it('removes the default forwarding policy from the time lock', () => {
      expect(calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.be.eql('200')
    })

    it('throws if there is not enough time lock for the forwarding policy', () => {
      extendedTimeLockDelta = '86300'

      return expect(() => calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.throw('Insufficient time lock')
    })

    it('can use different block times for different block chains', () => {
      secondsPerBlock = 150
      expect(calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.be.eql('500')
    })
  })

  describe('translateSwap', () => {
    let networkAddressFormatter
    let queryRoutes
    let sendToRoute
    let getInfo
    let client
    let engine
    let pubKey
    let address
    let swapHash
    let preimage
    let blockHeight
    let extendedTimeLock
    let amount
    let routes

    beforeEach(() => {
      address = 'fake address'
      pubKey = 'fake pubkey'
      swapHash = '9283479q8asfjsdfjoji=='
      preimage = 'as9fd8uas9df8ya98sfy=='
      amount = '100000'
      extendedTimeLock = '146400'
      blockHeight = 100

      routes = [
        { totalTimeLock: 150 },
        { totalTimeLock: 200 },
        { totalTimeLock: 201 }
      ]

      networkAddressFormatter = {
        parse: sinon.stub().withArgs(address).returns({ publicKey: pubKey })
      }
      queryRoutes = sinon.stub().resolves({ routes })
      sendToRoute = sinon.stub().resolves({ paymentPreimage: preimage })
      getInfo = sinon.stub().resolves({ blockHeight })

      translateSwap.__set__('networkAddressFormatter', networkAddressFormatter)
      translateSwap.__set__('queryRoutes', queryRoutes)
      translateSwap.__set__('sendToRoute', sendToRoute)
      translateSwap.__set__('getInfo', getInfo)

      client = 'fakeclient'
      engine = {
        client,
        currencyConfig: {
          secondsPerBlock: 600
        },
        logger: {
          info: sinon.stub(),
          error: sinon.stub(),
          debug: sinon.stub()
        }
      }
    })

    it('finds routes to the taker for the given amount', async () => {
      await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)

      expect(networkAddressFormatter.parse).to.have.been.calledOnce()
      expect(networkAddressFormatter.parse).to.have.been.calledWith(address)
      expect(queryRoutes).to.have.been.calledOnce()
      expect(queryRoutes).to.have.been.calledWith({ pubKey, amt: amount }, { client })
    })

    it('throws if no routes are available', () => {
      // remove all routes
      routes.splice(0, 3)
      expect(translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.be.rejectedWith('No route')
    })

    it('throws if the extended time lock is insufficient', () => {
      extendedTimeLock = '76400'

      return expect(translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.eventually.be.rejectedWith('Insufficient time lock')
    })

    it('sends to routes that are below the maximum time lock', async () => {
      await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)

      expect(sendToRoute).to.have.been.calledOnce()
      expect(sendToRoute).to.have.been.calledWith(swapHash, routes.slice(0, 2), { client })
    })

    it('throws if there are no routes below the maximum time lock', () => {
      // remove the fast routes
      routes.splice(0, 2)
      expect(translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.be.rejectedWith('No route')
    })

    it('throws if there is a payment error', () => {
      sendToRoute.resolves({ paymentError: 'fake error' })
      return expect(translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.eventually.be.rejectedWith('fake error')
    })

    it('returns the payment preiamge', async () => {
      expect(await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.be.eql(preimage)
    })
  })
})
