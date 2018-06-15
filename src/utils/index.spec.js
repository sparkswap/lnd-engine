const { expect } = require('test/test-helper')

const {
  Big
} = require('./index')

describe('utils index', () => {
  it('defines Big', () => {
    expect(Big).to.not.be.null()
    expect(Big).to.not.be.undefined()
  })
})
