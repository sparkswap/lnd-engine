const { expect } = require('test/test-helper')

const { hash } = require('./sha256')

describe('sha256', () => {
  describe('hash', () => {
    const cases = [
      {
        name: '#1',
        input: 'IzxHRP9Pk4gd/uUPAuzEqQ8J84SVThSx9X8HaDxZpqo=',
        output: 'CM9VlMahIx5kjlXHQ7lA9ponFrXg4ZC+QACukB26jzM='
      }
    ]

    cases.forEach(({ name, input, output }) => {
      it(`creates a hash for ${name}`, () => {
        expect(hash(input)).to.be.eql(output)
      })
    })
  })
})
