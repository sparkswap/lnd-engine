const { expect } = require('test/test-helper')

const {
  Big,
  networkAddressFormatter,
  sha256
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

  it('defines sha256', () => {
    expect(sha256).to.not.be.null()
    expect(sha256).to.not.be.undefined()
  })
})
