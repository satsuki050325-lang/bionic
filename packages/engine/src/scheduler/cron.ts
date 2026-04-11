export function validateCronExpression(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const [minute, hour, dom, month, dow] = parts

  if (dom !== '*' || month !== '*') return false
  if (!/^\d+$/.test(minute) || !/^\d+$/.test(hour) || !/^\d+$/.test(dow)) return false

  const minuteNum = parseInt(minute, 10)
  const hourNum = parseInt(hour, 10)
  const dowNum = parseInt(dow, 10)

  if (minuteNum < 0 || minuteNum > 59) return false
  if (hourNum < 0 || hourNum > 23) return false
  if (dowNum < 0 || dowNum > 6) return false

  return true
}
