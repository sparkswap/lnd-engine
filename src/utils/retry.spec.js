const { sinon, rewire, expect } = require('test/test-helper')
const path = require('path')

const retry = rewire(path.resolve(__dirname, 'retry'))

describe('retry', () => {
  let callFunction
  let delayTime
  let delay
  let logger
  let res
  let payload

  beforeEach(() => {
    res = 'response'
    callFunction = sinon.stub().resolves(res)
    delayTime = 100
    logger = {
      error: sinon.stub()
    }
    delay = sinon.stub().resolves()
    payload = { symbol: 'BTC' }
    retry.__set__('delay', delay)
  })

  it('calls the call function', async () => {
    await retry(callFunction, payload, { delayTime, logger })

    expect(callFunction).to.be.to.have.been.calledOnce()
  })

  it('returns the response of the callFunction if there were no errors', async () => {
    const result = await retry(callFunction, payload, { delayTime, logger })
    expect(result).to.eql(res)
  })

  it('retries the callFunction if there was an error', async () => {
    callFunction = sinon.stub()
    callFunction.onCall(0).rejects('Error')
    callFunction.onCall(1).resolves()
    await retry(callFunction, payload, { delayTime, logger })
    expect(logger.error).to.have.been.called()
    expect(delay).to.have.been.calledWith(delayTime)
    expect(callFunction).to.have.been.calledTwice()
  })

  it('calls the callFunction', async () => {
    callFunction = sinon.stub()
    callFunction.onCall(0).rejects('Error')
    callFunction.onCall(1).resolves()
    await retry(callFunction, payload, { delayTime, logger })

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

    retry(callFunction, payload, { delayTime, logger })

    setImmediate(() => {
      expect(callFunction).to.have.been.calledOnce()

      resolveDelay()

      setImmediate(() => expect(callFunction).to.have.been.calledTwice())
    })
  })
})
