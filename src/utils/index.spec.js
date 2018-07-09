const { expect } = require('test/test-helper')

const {
  Big,
  networkAddressFormatter
} = require('./index')

describe('utils index', () => {
  it('defines Big', () => {
    expect(Big).to.not.be.null()
    expect(Big).to.not.be.undefined()
  })

  it('defines networkAddressFormatter', () => {
    expect(networkAddressFormatter).to.not.be.null()
    expect(networkAddressFormatter).to.not.be.undefined()
  })
})
