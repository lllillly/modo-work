const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export function getToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDaysUntil(dueDate: string, today: string) {
  return (Date.parse(dueDate) - Date.parse(today)) / MILLISECONDS_PER_DAY
}

export function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatSelectedDate(value: string) {
  const date = parseDate(value)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getMonth() + 1}/${date.getDate()} (${weekday})`
}
