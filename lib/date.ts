// 날짜는 브라우저 로컬 시간 기준의 "YYYY-MM-DD" 문자열로 다룬다
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number)
  return toDateKey(new Date(y, m - 1, d + days))
}

export function formatDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number)
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(y, m - 1, d).getDay()
  ]
  return `${y}년 ${m}월 ${d}일 (${weekday})`
}
