const { expect } = require('test/test-helper')

const {
  Big,
  boltNetworkAddress
} = require('./index')

describe('utils index', () => {
  it('defines Big', () => {
    expect(Big).to.not.be.null()
    expect(Big).to.not.be.undefined()
  })

  it('defines boltNetworkAddress', () => {
    expect(boltNetworkAddress).to.not.be.null()
    expect(boltNetworkAddress).to.not.be.undefined()
  })
})
