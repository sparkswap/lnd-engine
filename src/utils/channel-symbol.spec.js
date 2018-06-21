const { expect } = require('test/test-helper')

const { symbolForFeeRate, feeRateForSymbol, getChannelSymbol } = require('./channel-symbol')

describe('channel-symbol', () => {
  describe('symbolForFeeRate', () => {
    it('returns LTC', () => {
      expect(symbolForFeeRate('7')).to.be.eql('LTC')
    })

    it('returns BTC', () => {
      expect(symbolForFeeRate('6')).to.be.eql('BTC')
    })

    it('works with numbers', () => {
      expect(symbolForFeeRate(6)).to.be.eql('BTC')
    })

    it('returns undefined for an unknown fee rate', () => {
      expect(symbolForFeeRate('8667')).to.be.undefined()
    })
  })

  describe('feeRateForSymbol', () => {
    it('returns the BTC fee rate', () => {
      expect(feeRateForSymbol('BTC')).to.be.eql('6')
    })

    it('returns the LTC fee rate', () => {
      expect(feeRateForSymbol('LTC')).to.be.eql('7')
    })

    it('returns undefined for an unknown symbol', () => {
      expect(feeRateForSymbol('XYZ')).to.be.undefined()
    })
  })

  describe('getChannelSymbol', () => {
    let node1Policy
    let node2Policy

    beforeEach(() => {
      node1Policy = {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '7',
        minHtlc: '144',
        timeLockDelta: 9
      }
      node2Policy = {
        feeBaseMsat: '2000',
        feeRateMilliMsat: '7',
        minHtlc: '144',
        timeLockDelta: 10
      }
    })

    it('returns LTC for the LTC policy', () => {
      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('LTC')
    })

    it('returns BTC for the BTC policy', () => {
      node1Policy.feeRateMilliMsat = '6'
      node2Policy.feeRateMilliMsat = '6'
      expect(getChannelSymbol(node1Policy, node1Policy)).to.be.equal('BTC')
    })

    it('returns LTC if one channel is not on the same page', () => {
      node2Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('LTC')
    })

    it('returns LTC if the other channel is not on the same page', () => {
      node1Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('LTC')
    })

    it('returns false if no symbol is defined', () => {
      node2Policy.feeRateMilliMsat = '1000'
      node1Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.eql(false)
    })

    it('throws if the channels disagree', () => {
      node1Policy.feeRateMilliMsat = '6'

      expect(() => { getChannelSymbol(node1Policy, node2Policy) }).to.throw('mismatch')
    })
  })
})
