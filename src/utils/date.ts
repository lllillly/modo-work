const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const seoulDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getToday() {
  return seoulDateFormatter.format(new Date())
}

export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDaysUntil(dueDate: string, today: string) {
  return (Date.parse(dueDate) - Date.parse(today)) / MILLISECONDS_PER_DAY
}

export function toDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(value: string, days: number) {
  const date = parseDate(value)
  date.setDate(date.getDate() + days)
  return toDateText(date)
}

export function formatDate(value?: string | null) {
  return value ? seoulDateFormatter.format(new Date(value)).replaceAll('-', '.') : '-'
}

export function formatMonthDay(value: string) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

export function formatSelectedDate(value: string) {
  const date = parseDate(value)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getMonth() + 1}/${date.getDate()} (${weekday})`
}

export function formatDateWithDay(value: string, withYear = false) {
  const day = value.includes('T') ? seoulDateFormatter.format(new Date(value)) : value
  const date = parseDate(day)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)

  if (withYear) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${dayOfMonth} (${weekday})`
  }

  return `${date.getMonth() + 1}/${date.getDate()}(${weekday})`
}

function getSeoulParts(value: string, options: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...options,
  }).formatToParts(new Date(value))
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function formatDateTime(value: string) {
  const { year, month, day, hour, minute } = getSeoulParts(value, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${year}.${month}.${day} ${hour}:${minute}`
}

export function formatShortDateTime(value?: string | null, withWeekday = true) {
  if (!value) return ''
  const { month, day, weekday, hour, minute } = getSeoulParts(value, {
    month: 'numeric',
    day: 'numeric',
    weekday: withWeekday ? 'short' : undefined,
  })
  return `${month}/${day}${withWeekday ? ` (${weekday})` : ''} ${hour}:${minute}`
}
