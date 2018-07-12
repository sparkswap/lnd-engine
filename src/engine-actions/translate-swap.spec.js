const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const translateSwap = rewire(path.resolve(__dirname, 'translate-swap'))

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
  let maxTimeLock
  let amount
  let routes

  beforeEach(() => {
    address = 'fake address'
    pubKey = 'fake pubkey'
    swapHash = '9283479q8asfjsdfjoji=='
    preimage = 'as9fd8uas9df8ya98sfy=='
    amount = '100000'
    maxTimeLock = '60000'
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
    await translateSwap.call(engine, address, swapHash, amount, maxTimeLock)

    expect(networkAddressFormatter.parse).to.have.been.calledOnce()
    expect(networkAddressFormatter.parse).to.have.been.calledWith(address)
    expect(queryRoutes).to.have.been.calledOnce()
    expect(queryRoutes).to.have.been.calledWith({ pubKey, amt: amount }, { client })
  })

  it('sends to routes that are below the maximum time lock', async () => {
    await translateSwap.call(engine, address, swapHash, amount, maxTimeLock)

    expect(sendToRoute).to.have.been.calledOnce()
    expect(sendToRoute).to.have.been.calledWith(swapHash, routes.slice(0, 2), { client })
  })

  it('throws if there is a payment error', () => {
    sendToRoute.resolves({ paymentError: 'fake error' })
    return expect(translateSwap.call(engine, address, swapHash, amount, maxTimeLock)).to.eventually.be.rejectedWith('fake error')
  })

  it('returns the payment preiamge', async () => {
    expect(await translateSwap.call(engine, address, swapHash, amount, maxTimeLock)).to.be.eql(preimage)
  })
})
