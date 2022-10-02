import { describe, expect, it } from '@jest/globals'
import { setRideDate } from '../../../src/utils/bot'

describe('utils.bot module', () => {
  describe('setRideDate()', () => {
    jest.useFakeTimers().setSystemTime(new Date('2022-01-01 12:00'))

    it('should set date to same day with valid hours and minutes', () => {
      expect(setRideDate(13)).toEqual(new Date('2022-01-01 13:00'))
      expect(setRideDate(13, 30)).toEqual(new Date('2022-01-01 13:30'))
      expect(setRideDate(13, 30, false)).toEqual(new Date('2022-01-01 13:30'))
    })

    it('should set date to next day with valid hours and minutes', () => {
      expect(setRideDate(11)).toEqual(new Date('2022-01-02 11:00'))
      expect(setRideDate(11, 30)).toEqual(new Date('2022-01-02 11:30'))
      expect(setRideDate(11, 30, false)).toEqual(new Date('2022-01-02 11:30'))
    })

    it('should force date to same day when isToday is True', () => {
      expect(setRideDate(11, 0, true)).toEqual(new Date('2022-01-01 11:00'))
      expect(setRideDate(11, 30, true)).toEqual(new Date('2022-01-01 11:30'))
    })
  })
})
