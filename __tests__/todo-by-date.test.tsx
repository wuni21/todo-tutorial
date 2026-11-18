import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { StatusView } from "@/components/status-view"
import { TodoApp } from "@/components/todo-app"
import { shiftDateKey, todayKey } from "@/lib/date"
import { groupByDate } from "@/lib/todo-stats"

const today = todayKey()
const yesterday = shiftDateKey(today, -1)

const seed = (todos: object[]) =>
  window.localStorage.setItem("todos", JSON.stringify(todos))

describe("날짜별 할 일", () => {
  it("선택한 날짜의 할 일만 보이고, 이전 날짜로 이동할 수 있다", async () => {
    seed([
      { id: "1", text: "오늘 할 일", completed: false, date: today },
      { id: "2", text: "어제 할 일", completed: true, date: yesterday },
    ])
    const user = userEvent.setup()
    render(<TodoApp />)

    expect(screen.getByText("오늘 할 일")).toBeInTheDocument()
    expect(screen.queryByText("어제 할 일")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "이전 날짜" }))

    expect(screen.getByText("어제 할 일")).toBeInTheDocument()
    expect(screen.queryByText("오늘 할 일")).not.toBeInTheDocument()
  })

  it("선택한 날짜에 새 할 일이 저장된다", async () => {
    const user = userEvent.setup()
    render(<TodoApp />)
    await user.click(screen.getByRole("button", { name: "이전 날짜" }))
    await user.type(screen.getByRole("textbox", { name: "새 할 일" }), "빨래{Enter}")

    const stored = JSON.parse(window.localStorage.getItem("todos")!)
    expect(stored[0]).toMatchObject({ text: "빨래", date: yesterday })
  })

  it("날짜가 없는 기존 할 일은 오늘로 취급한다", () => {
    seed([{ id: "1", text: "옛날 항목", completed: false }])
    render(<TodoApp />)
    expect(screen.getByText("옛날 항목")).toBeInTheDocument()
  })
})

describe("Status 페이지", () => {
  it("날짜별 완료 수와 진행률을 보여준다", () => {
    seed([
      { id: "1", text: "a", completed: true, date: today },
      { id: "2", text: "b", completed: false, date: today },
      { id: "3", text: "c", completed: true, date: yesterday },
    ])
    render(<StatusView />)

    expect(screen.getByText("1/2 완료 · 50%")).toBeInTheDocument()
    expect(screen.getByText("1/1 완료 · 100%")).toBeInTheDocument()
    expect(screen.getByText("3개 중 2개 완료 · 2일")).toBeInTheDocument()
  })

  it("할 일이 없으면 안내 문구를 보여준다", () => {
    render(<StatusView />)
    expect(screen.getByText("아직 등록된 할 일이 없습니다")).toBeInTheDocument()
  })

  it("groupByDate는 최근 날짜를 먼저 정렬한다", () => {
    const days = groupByDate([
      { id: "1", text: "a", completed: false, date: "2026-01-01" },
      { id: "2", text: "b", completed: false, date: "2026-02-01" },
    ])
    expect(days.map((d) => d.date)).toEqual(["2026-02-01", "2026-01-01"])
  })
})
