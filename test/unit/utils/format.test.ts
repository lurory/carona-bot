jest.mock('../../../src/utils/const.js', () => ({
  specialUsers: new Map([['SpecialUser', 'fakeEmojiCode']])
}))

import { describe, expect, it } from '@jest/globals'
import {
  strikeThrough,
  addZeroPadding,
  isString,
  getUserEmoji,
  compareValues
} from '../../../src/utils/format.js'

describe('utils.format module', () => {
  describe('strikeThrough()', () => {
    it('should wrap a string with the HTML tag <s>', () => {
      expect(strikeThrough('abc')).toEqual('<s>abc</s>')
      expect(strikeThrough('')).toEqual('<s></s>')
    })
  })

  describe('addZeroPadding()', () => {
    it('should left pad a single digit number with one zero', () => {
      expect(addZeroPadding(1)).toEqual('01')
    })
    it('should return the number as string if it already has 2 digits', () => {
      expect(addZeroPadding(10)).toEqual('10')
    })
  })

  describe('isString()', () => {
    it('should return true if it is an string', () => {
      expect(isString('')).toBe(true)
      expect(isString('abc')).toBe(true)
      expect(isString(new String('abc'))).toBe(true)
    })
    it('should return false if it is not an string', () => {
      expect(isString(10)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
    })
  })

  describe('getUserEmoji()', () => {
    it('should return user emoji if its username is in the specialUsers const', () => {
      const fakeUser = {
        username: 'SpecialUser',
        id: 0,
        is_bot: false,
        first_name: ''
      }
      expect(getUserEmoji(fakeUser)).toEqual('fakeEmojiCode')
    })

    it('should return an empty string if its username is not in the specialUsers const', () => {
      const fakeUser = {
        username: 'User',
        id: 0,
        is_bot: false,
        first_name: ''
      }
      expect(getUserEmoji(fakeUser)).toEqual('')
    })

    it('should return an empty string if the user does not have an username', () => {
      const fakeUser = {
        id: 0,
        is_bot: false,
        first_name: ''
      }
      expect(getUserEmoji(fakeUser)).toEqual('')
    })
  })

  describe('compareValues()', () => {
    it('should return 0 if the values are equal', () => {
      expect(compareValues(10, 10)).toEqual(0)
      expect(compareValues('abc', 'abc')).toEqual(0)
      expect(compareValues(new Date('2022-01-01'), new Date('2022-01-01'))).toEqual(0)
      expect(
        compareValues(new Date('2022-01-01 00:00:00'), new Date('2022-01-01 00:00:00'))
      ).toEqual(0)
    })

    it('should return 1 if the first value is greater than the other', () => {
      expect(compareValues(11, 10)).toEqual(1)
      expect(compareValues('bcd', 'abc')).toEqual(1)
      expect(compareValues(new Date('2022-01-02'), new Date('2022-01-01'))).toEqual(1)
      expect(
        compareValues(new Date('2022-01-01 00:00:01'), new Date('2022-01-01 00:00:00'))
      ).toEqual(1)
    })

    it('should return -1 if the first value is smaller than the other', () => {
      expect(compareValues(9, 10)).toEqual(-1)
      expect(compareValues('abc', 'bcd')).toEqual(-1)
      expect(compareValues(new Date('2022-01-01'), new Date('2022-01-02'))).toEqual(-1)
      expect(
        compareValues(new Date('2022-01-01 00:00:00'), new Date('2022-01-01 00:00:01'))
      ).toEqual(-1)
    })
  })
})
