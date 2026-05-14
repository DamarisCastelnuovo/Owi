function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// nth occurrence of a weekday (1=Mon..7=Sun) in a given month
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  // weekday: 1=Monday, 7=Sunday (ISO)
  const first = new Date(year, month - 1, 1)
  const firstDow = first.getDay() || 7 // convert 0(Sun) → 7
  let offset = weekday - firstDow
  if (offset < 0) offset += 7
  const day = 1 + offset + (n - 1) * 7
  return new Date(year, month - 1, day)
}

function argentineHolidays(year: number): Set<string> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const easter = easterSunday(year)

  const fixed = [
    `${year}-01-01`, // Año Nuevo
    `${year}-03-24`, // Día de la Memoria
    `${year}-04-02`, // Día del Veterano
    `${year}-05-01`, // Día del Trabajador
    `${year}-05-25`, // Revolución de Mayo
    `${year}-07-09`, // Independencia
    `${year}-12-08`, // Inmaculada Concepción
    `${year}-12-25`, // Navidad
  ]

  const movable = [
    fmt(addDays(easter, -48)), // Lunes de Carnaval
    fmt(addDays(easter, -47)), // Martes de Carnaval
    fmt(addDays(easter, -2)),  // Viernes Santo
    fmt(nthWeekday(year, 6, 1, 3)),  // Paso a la Inmortalidad de Belgrano — 3er lunes de junio
    fmt(nthWeekday(year, 8, 1, 3)),  // Paso a la Inmortalidad de San Martín — 3er lunes de agosto
    fmt(nthWeekday(year, 10, 1, 2)), // Día del Respeto a la Diversidad Cultural — 2do lunes de octubre
    fmt(nthWeekday(year, 11, 1, 4)), // Día de la Soberanía Nacional — 4to lunes de noviembre
  ]

  return new Set([...fixed, ...movable])
}

function isHoliday(date: Date, holidayCache: Map<number, Set<string>>): boolean {
  const year = date.getFullYear()
  if (!holidayCache.has(year)) holidayCache.set(year, argentineHolidays(year))
  const fmt = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return holidayCache.get(year)!.has(fmt)
}

function isWorkday(date: Date, cache: Map<number, Set<string>>): boolean {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return false // weekend
  return !isHoliday(date, cache)
}

export function businessDaysSince(isoDate: string): number {
  const cache = new Map<number, Set<string>>()
  const start = new Date(isoDate)
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (start >= now) return 0

  let count = 0
  const cur = new Date(start)
  cur.setDate(cur.getDate() + 1) // start counting from the day after start
  while (cur <= now) {
    if (isWorkday(cur, cache)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function businessDaysBetween(isoStart: string, isoEnd: string): number {
  const cache = new Map<number, Set<string>>()
  const start = new Date(isoStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(isoEnd)
  end.setHours(0, 0, 0, 0)
  if (start >= end) return 0
  let count = 0
  const cur = new Date(start)
  cur.setDate(cur.getDate() + 1)
  while (cur <= end) {
    if (isWorkday(cur, cache)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function daysSince(isoDate: string): number {
  return businessDaysSince(isoDate)
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
