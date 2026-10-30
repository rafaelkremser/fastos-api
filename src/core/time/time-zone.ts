// Every store is in Brazil for now; there is no time zone per store yet
export const STORE_TIME_ZONE = 'America/Sao_Paulo'

// The calendar day (YYYY-MM-DD) an instant falls on in the time zone
export function getDayInTimeZone(date: Date, timeZone: string) {
  // en-CA writes dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// How far the time zone's clock is from UTC at an instant, in milliseconds
function getOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)!.value)

  const clock = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )

  return clock - Math.floor(date.getTime() / 1000) * 1000
}

// The instant a calendar day (YYYY-MM-DD) begins in the time zone
export function startOfDayInTimeZone(day: string, timeZone: string) {
  const midnightInUTC = new Date(`${day}T00:00:00.000Z`)

  return new Date(midnightInUTC.getTime() - getOffset(midnightInUTC, timeZone))
}

// A calendar day (YYYY-MM-DD) moved by a number of days
export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)

  return date.toISOString().slice(0, 10)
}

// The first day (YYYY-MM-DD) of the month a day falls in, moved by months
export function startOfMonth(day: string, monthsToAdd = 0) {
  const [year, month] = day.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + monthsToAdd, 1))

  return date.toISOString().slice(0, 10)
}
