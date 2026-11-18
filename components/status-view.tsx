"use client"

import { useSyncExternalStore } from "react"
import { CheckCircle2Icon } from "lucide-react"

import { ProgressBar } from "@/components/progress-bar"
import { useTodos } from "@/hooks/use-todos"
import { formatDateLabel, todayKey } from "@/lib/date"
import { groupByDate, summarize } from "@/lib/todo-stats"

// "오늘" 표시는 브라우저에서만 알 수 있으므로 구독할 이벤트 없이 읽는다
const subscribeNothing = () => () => {}

export function StatusView() {
  const { todos } = useTodos()
  const days = groupByDate(todos)
  const overall = summarize(todos)
  const today = useSyncExternalStore(subscribeNothing, todayKey, () => "")

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
        className="flex flex-col gap-3 rounded-xl border bg-card p-5"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">전체</span>
          <span className="text-3xl font-bold tabular-nums">
            {overall.percent}%
          </span>
        </div>
        <ProgressBar percent={overall.percent} label="전체 진행률" />
        <p className="text-xs text-muted-foreground">
          {overall.total}개 중 {overall.completed}개 완료 · {days.length}일
        </p>
      </section>
      <ul className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {days.map((day) => (
          <li key={day.date} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                {formatDateLabel(day.date)}
                {day.date === today && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    오늘
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                {day.percent === 100 && (
                  <CheckCircle2Icon
                    className="size-4 text-primary"
                    aria-hidden
                  />
                )}
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
