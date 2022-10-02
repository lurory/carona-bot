import { describe, expect, it } from '@jest/globals'
import { parseHoursMinutes } from '../../../src/utils/date'

describe('utils.date module', () => {
  describe('parseHoursMinutes()', () => {
    it('should parse valid time formats into hours and minutes', () => {
      expect(parseHoursMinutes('0')).toEqual({ hours: 0, minutes: NaN })
      expect(parseHoursMinutes('1')).toEqual({ hours: 1, minutes: NaN })
      expect(parseHoursMinutes('00')).toEqual({ hours: 0, minutes: NaN })
      expect(parseHoursMinutes('01')).toEqual({ hours: 1, minutes: NaN })
      expect(parseHoursMinutes('23')).toEqual({ hours: 23, minutes: NaN })
      expect(parseHoursMinutes('10h')).toEqual({ hours: 10, minutes: NaN })
      expect(parseHoursMinutes('00h00')).toEqual({ hours: 0, minutes: 0 })
      expect(parseHoursMinutes('00:00')).toEqual({ hours: 0, minutes: 0 })
      expect(parseHoursMinutes('23:59')).toEqual({ hours: 23, minutes: 59 })
    })

    it('should return null for invalid time format', () => {
      // Invalid dates
      expect(parseHoursMinutes('')).toBe(null)
      expect(parseHoursMinutes('abc')).toBe(null)

      // Out of range values
      expect(parseHoursMinutes('24')).toBe(null)
      expect(parseHoursMinutes('24h')).toBe(null)
      expect(parseHoursMinutes('23h60')).toBe(null)
      expect(parseHoursMinutes('23:60')).toBe(null)

      // Minutes not zero-padded
      expect(parseHoursMinutes('23:0')).toBe(null)
      expect(parseHoursMinutes('23h1')).toBe(null)
    })
  })
})
