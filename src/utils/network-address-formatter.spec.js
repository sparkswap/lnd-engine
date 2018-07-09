const { expect } = require('test/test-helper')

const { parse, serialize } = require('./network-address-formatter')

describe('network-address-formatter', () => {
  describe('parse', () => {
    it('parses a bolt network address', () => {
      expect(parse('bolt:123192380asfasdf@localhost')).to.be.eql({
        publicKey: '123192380asfasdf',
        host: 'localhost'
      })
    })

    it('parses a network address without a host', () => {
      expect(parse('bolt:123192380asfasdf')).to.be.eql({
        publicKey: '123192380asfasdf'
      })
    })

    it('parses a network address with a host with a port', () => {
      expect(parse('bolt:123192380asfasdf@localhost:1234')).to.be.eql({
        publicKey: '123192380asfasdf',
        host: 'localhost:1234'
      })
    })

    it('throws if the network type is not bolt', () => {
      expect(() => parse('newnetwork:1234@localhost:1234')).to.throw('Unable to parse address')
    })
  })

  describe('serialize', () => {
    it('serializes a network address', () => {
      expect(serialize({
        publicKey: '123192380asfasdf',
        host: 'localhost'
      })).to.be.eql('bolt:123192380asfasdf@localhost')
    })

    it('serializes a network address without a host', () => {
      expect(serialize({
        publicKey: '123192380asfasdf'
      })).to.be.eql('bolt:123192380asfasdf')
    })

    it('serializes a network address with a host with a port', () => {
      expect(serialize({
        publicKey: '123192380asfasdf',
        host: 'localhost:1234'
      })).to.be.eql('bolt:123192380asfasdf@localhost:1234')
    })
  })
})
