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

  const deleteTodo = useCallback(
    (id: string) => update((prev) => prev.filter((t) => t.id !== id)),
    [update]
  )

  const editTodo = useCallback(
    (id: string, text: string) =>
      update((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t))),
    [update]
  )

  const clearCompleted = useCallback(
    // 지정한 날짜의 완료 항목만 지운다
    (date: string) =>
      update((prev) => prev.filter((t) => !(t.completed && t.date === date))),
    [update]
  )

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted }
}
