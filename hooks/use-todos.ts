"use client"

import { useCallback, useSyncExternalStore } from "react"

import { todayKey } from "@/lib/date"

export type Todo = {
  id: string
  text: string
  completed: boolean
  // 이 할 일이 속한 날짜 (YYYY-MM-DD)
  date: string
}

// 지운 할 일과 원래 위치. 되돌릴 때 원래 바로 뒤에 있던 항목(nextId) 앞에
// 다시 넣는다. 그 사이 새 항목이 추가돼도 자리가 밀리지 않는다
export type RemovedTodo = { todo: Todo; index: number; nextId: string | null }

const STORAGE_KEY = "todos"
const EMPTY: Todo[] = []

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedTodos: Todo[] = EMPTY

function readTodos(): Todo[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === cachedRaw) return cachedTodos
  cachedRaw = raw
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    // 날짜 기능 이전에 저장된 할 일은 오늘 날짜로 취급한다
    cachedTodos = Array.isArray(parsed)
      ? (parsed as Partial<Todo>[]).map(
          (t) => ({ ...t, date: t.date ?? todayKey() }) as Todo
        )
      : EMPTY
  } catch {
    cachedTodos = EMPTY
  }
  return cachedTodos
}

function writeTodos(todos: Todo[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // 다른 탭에서 바뀐 내용도 반영
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function useTodos() {
  const todos = useSyncExternalStore(subscribe, readTodos, () => EMPTY)

  const update = useCallback((fn: (prev: Todo[]) => Todo[]) => {
    writeTodos(fn(readTodos()))
  }, [])

  const addTodo = useCallback(
    (text: string, date: string = todayKey()) =>
      update((prev) => [
        { id: crypto.randomUUID(), text, completed: false, date },
        ...prev,
      ]),
    [update]
  )

  const toggleTodo = useCallback(
    (id: string) =>
      update((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      ),
    [update]
  )

  // 조건에 맞는 할 일을 지우고, 되돌릴 수 있도록 지운 항목을 돌려준다
  const removeWhere = useCallback((match: (todo: Todo) => boolean) => {
    const prev = readTodos()
    const removed: RemovedTodo[] = prev.flatMap((todo, index) =>
      match(todo) ? [{ todo, index, nextId: prev[index + 1]?.id ?? null }] : []
    )
    if (removed.length > 0) writeTodos(prev.filter((t) => !match(t)))
    return removed
  }, [])

  const deleteTodo = useCallback(
    (id: string) => removeWhere((t) => t.id === id),
    [removeWhere]
  )

  const editTodo = useCallback(
    (id: string, text: string) =>
      update((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t))),
    [update]
  )

  const clearCompleted = useCallback(
    // 지정한 날짜의 완료 항목만 지운다
    (date: string) => removeWhere((t) => t.completed && t.date === date),
    [removeWhere]
  )

  const restoreTodos = useCallback(
    // 뒤쪽 항목부터 넣어야, 연달아 지운 항목들도 서로를 기준으로 제자리를 찾는다
    (removed: RemovedTodo[]) =>
      update((prev) => {
        const next = [...prev]
        for (const { todo, index, nextId } of [...removed].sort(
          (a, b) => b.index - a.index
        )) {
          const anchor =
            nextId === null
              ? next.length
              : next.findIndex((t) => t.id === nextId)
          // 기준 항목도 그사이 지워졌으면 원래 순번 자리에 넣는다
          next.splice(
            anchor >= 0 ? anchor : Math.min(index, next.length),
            0,
            todo
          )
        }
        return next
      }),
    [update]
  )

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    restoreTodos,
  }
}
