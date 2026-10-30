import {
  addDays,
  getDayInTimeZone,
  startOfDayInTimeZone,
  startOfMonth,
  STORE_TIME_ZONE,
} from './time-zone'

describe('Time zone', () => {
  it('should tell the day in Brazil, which turns three hours after UTC', () => {
    expect(
      getDayInTimeZone(new Date('2026-10-30T02:59:00Z'), STORE_TIME_ZONE),
    ).toBe('2026-10-29')
    expect(
      getDayInTimeZone(new Date('2026-10-30T03:00:00Z'), STORE_TIME_ZONE),
    ).toBe('2026-10-30')
  })

  it('should find when a day begins in Brazil', () => {
    expect(startOfDayInTimeZone('2026-10-30', STORE_TIME_ZONE)).toEqual(
      new Date('2026-10-30T03:00:00Z'),
    )
    expect(startOfDayInTimeZone('2026-10-30', 'UTC')).toEqual(
      new Date('2026-10-30T00:00:00Z'),
    )
  })

  it('should move days and months across their ends', () => {
    expect(addDays('2026-10-30', 2)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(startOfMonth('2026-10-30')).toBe('2026-10-01')
    expect(startOfMonth('2026-01-15', -1)).toBe('2025-12-01')
  })
})
