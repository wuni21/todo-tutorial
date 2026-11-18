"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { ProgressBar } from "@/components/progress-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTodos, type Todo } from "@/hooks/use-todos"
import { formatDateLabel, shiftDateKey, todayKey } from "@/lib/date"
import { summarize } from "@/lib/todo-stats"
import { cn } from "@/lib/utils"

type Filter = "all" | "active" | "completed"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
]

// localStorage 지원 여부는 바뀌지 않으므로 구독할 이벤트가 없다
const subscribeNothing = () => () => {}

export function TodoApp() {
  const { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted } =
    useTodos()
  const [draft, setDraft] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  // 서버에는 "오늘"을 알 수 없으므로 빈 값으로 그리고, hydration 뒤 브라우저 값으로 바꾼다
  const today = useSyncExternalStore(subscribeNothing, todayKey, () => "")
  const [picked, setPicked] = useState<string | null>(null)
  const date = picked ?? today

  const dayTodos = todos.filter((todo) => todo.date === date)
  const completedCount = dayTodos.filter((todo) => todo.completed).length

  const visibleTodos = dayTodos.filter((todo) =>
    filter === "all"
      ? true
      : filter === "active"
        ? !todo.completed
        : todo.completed
  )

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    addTodo(text, date)
    setDraft("")
    // 새 항목이 필터에 가려지지 않도록 전체 보기로 돌아간다
    setFilter("all")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter는 무시 (중복 추가 방지)
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return
    submit()
  }

  const canSave = useSyncExternalStore(
    subscribeNothing,
    () => "localStorage" in window,
    // 서버는 브라우저 기능을 알 수 없으므로 대부분의 경우인 "저장됨"으로 그린다.
    // hydration이 끝난 뒤 실제 브라우저 값으로 다시 그려 불일치 에러를 막는다
    () => true
  )

  const { percent } = summarize(dayTodos)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPicked(shiftDateKey(date, -1))}
          disabled={!date}
          aria-label="이전 날짜"
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="min-h-6 text-base font-semibold">
            {date ? formatDateLabel(date) : " "}
          </span>
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setPicked(e.target.value)}
            aria-label="날짜 선택"
            className="h-7 w-36 border-none bg-transparent text-center text-xs text-muted-foreground shadow-none dark:bg-transparent"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPicked(shiftDateKey(date, 1))}
          disabled={!date}
          aria-label="다음 날짜"
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar
          percent={percent}
          label="이 날짜 진행률"
          className="flex-1"
        />
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {completedCount}/{dayTodos.length} · {percent}%
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setPicked(null)}
          disabled={!picked || picked === today}
        >
          오늘
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="할 일을 입력하고 Enter"
          aria-label="새 할 일"
          autoFocus
          className="h-10"
        />
        <Button
          size="icon-lg"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="할 일 추가"
        >
          <PlusIcon />
        </Button>
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList aria-label="필터" className="w-full">
          {FILTERS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {visibleTodos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-muted-foreground">
          <ClipboardListIcon className="size-8 opacity-50" aria-hidden />
          <p className="text-sm">
            {dayTodos.length === 0
              ? "이 날짜에는 할 일이 없습니다"
              : "해당하는 할 일이 없습니다"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl border">
          {visibleTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
              onEdit={(text) => editTodo(todo.id, text)}
            />
          ))}
        </ul>
      )}
      <div className="flex min-h-8 items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {canSave
            ? "할 일은 이 브라우저에 저장됩니다"
            : "이 브라우저에서는 할 일이 저장되지 않습니다"}
        </p>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearCompleted(date)}
            className="text-muted-foreground hover:text-destructive"
          >
            완료한 일 지우기 ({completedCount})
          </Button>
        )}
      </div>
    </div>
  )
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo
  onToggle: () => void
  onDelete: () => void
  onEdit: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(todo.text)
  // 편집 종료 후 언마운트 시 발생하는 blur가 다시 저장하지 않도록 막는다
  const editingRef = useRef(false)

  const startEdit = () => {
    setValue(todo.text)
    editingRef.current = true
    setEditing(true)
  }

  const finish = () => {
    editingRef.current = false
    setEditing(false)
  }

  const commit = () => {
    if (!editingRef.current) return
    const text = value.trim()
    // 빈 값이면 원래 텍스트 유지
    if (text && text !== todo.text) onEdit(text)
    finish()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Enter") commit()
    if (e.key === "Escape") finish()
  }

  return (
    <li className="group flex min-h-12 items-center gap-3 px-3 transition-colors hover:bg-muted/50">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={onToggle}
        aria-label={`${todo.text} 완료`}
      />
      {editing ? (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          aria-label="할 일 수정"
          autoFocus
          className="h-8 flex-1"
        />
      ) : (
        <span
          onDoubleClick={startEdit}
          className={cn(
            "flex-1 cursor-text py-2 text-sm break-all select-none",
            todo.completed && "text-muted-foreground line-through"
          )}
        >
          {todo.text}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`${todo.text} 삭제`}
        className="text-muted-foreground hover:text-destructive pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
      >
        <Trash2Icon />
      </Button>
    </li>
  )
}
