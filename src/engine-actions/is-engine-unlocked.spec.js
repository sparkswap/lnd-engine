const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isEngineUnlocked = rewire(path.resolve(__dirname, 'is-engine-unlocked'))

describe('isEngineUnlocked', () => {
  beforeEach(() => {

  })

  it('makes a call to genSeed to see if lnd is unlocked', () => {})
  it('')
})
