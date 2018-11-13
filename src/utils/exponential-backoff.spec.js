const { sinon, rewire, expect } = require('test/test-helper')
const path = require('path')

const exponentialBackoff = rewire(path.resolve(__dirname, 'exponential-backoff'))

describe('exponentialBackoff', () => {
  let callFunction
  let attempts
  let delayTime
  let delay
  let logger
  let res
  let payload
  let engine

  beforeEach(() => {
    res = 'response'
    callFunction = sinon.stub().resolves(res)
    attempts = 2
    delayTime = 100
    logger = {
      error: sinon.stub()
    }
    engine = { logger }
    delay = sinon.stub().resolves()
    payload = { symbol: 'BTC' }
    exponentialBackoff.__set__('delay', delay)
  })

  it('calls the call function', async () => {
    await exponentialBackoff.call(engine, callFunction, payload, null, attempts)

    expect(callFunction).to.be.to.have.been.calledOnce()
  })

  it('returns the response of the callFunction if there were no errors', async () => {
    const result = await exponentialBackoff.call(engine, callFunction, payload, null, attempts)
    expect(result).to.eql(res)
  })

  it('retries the callFunction if there was an error and there are still retries left', async () => {
    callFunction = sinon.stub()
    callFunction.onCall(0).rejects('Error')
    callFunction.onCall(1).resolves()
    await exponentialBackoff.call(engine, callFunction, payload, null, attempts, delayTime)
    expect(logger.error).to.have.been.called()
    expect(delay).to.have.been.calledWith(delayTime)
    expect(callFunction).to.have.been.calledTwice()
  })

  it('calls the callFunction', async () => {
    callFunction = sinon.stub()
    callFunction.onCall(0).rejects('Error')
    callFunction.onCall(1).resolves()
    await exponentialBackoff.call(engine, callFunction, payload, null, attempts)

    expect(delay.getCall(0).calledBefore(callFunction.getCall(1))).to.be.true()
  })

  it('callFunction only gets called after delay resolves', async () => {
    callFunction = sinon.stub()
    callFunction.onCall(0).rejects('Error')
    callFunction.onCall(1).resolves()

    let resolveDelay

    delay.callsFake((ms) => {
      return new Promise((resolve, reject) => {
        resolveDelay = resolve
      })
    })

    exponentialBackoff.call(engine, callFunction, payload, null, attempts, delayTime)

    setImmediate(() => {
      expect(callFunction).to.have.been.calledOnce()

      resolveDelay()

      setImmediate(() => expect(callFunction).to.have.been.calledTwice())
    })
  })
})
