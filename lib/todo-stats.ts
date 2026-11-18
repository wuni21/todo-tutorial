import type { Todo } from "@/hooks/use-todos"

export type DayStat = {
  date: string
  total: number
  completed: number
  percent: number
}

const percentOf = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100)

// 날짜별 진행 현황. 최근 날짜가 먼저 온다
export function groupByDate(todos: Todo[]): DayStat[] {
  const map = new Map<string, { total: number; completed: number }>()
  for (const todo of todos) {
    const stat = map.get(todo.date) ?? { total: 0, completed: 0 }
    stat.total += 1
    if (todo.completed) stat.completed += 1
    map.set(todo.date, stat)
  }
  return [...map.entries()]
    .map(([date, { total, completed }]) => ({
      date,
      total,
      completed,
      percent: percentOf(completed, total),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function summarize(todos: Todo[]) {
  const completed = todos.filter((t) => t.completed).length
  return {
    total: todos.length,
    completed,
    percent: percentOf(completed, todos.length),
  }
}
