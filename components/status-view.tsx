"use client"

import { useTodos } from "@/hooks/use-todos"
import { formatDateLabel } from "@/lib/date"
import { groupByDate, summarize } from "@/lib/todo-stats"

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function StatusView() {
  const { todos } = useTodos()
  const days = groupByDate(todos)
  const overall = summarize(todos)

  if (days.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        아직 등록된 할 일이 없습니다
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="전체 진행 현황"
        className="flex flex-col gap-2 rounded-xl border p-4"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">전체</span>
          <span className="text-2xl font-bold">{overall.percent}%</span>
        </div>
        <ProgressBar percent={overall.percent} label="전체 진행률" />
        <p className="text-xs text-muted-foreground">
          {overall.total}개 중 {overall.completed}개 완료 · {days.length}일
        </p>
      </section>
      <ul className="flex flex-col gap-4">
        {days.map((day) => (
          <li key={day.date} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{formatDateLabel(day.date)}</span>
              <span className="text-muted-foreground">
                {day.completed}/{day.total} 완료 · {day.percent}%
              </span>
            </div>
            <ProgressBar
              percent={day.percent}
              label={`${formatDateLabel(day.date)} 진행률`}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
