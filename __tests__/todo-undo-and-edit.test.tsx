import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { todayKey } from "@/lib/date"
import { TodoApp } from "@/components/todo-app"

// 완료 2개, 미완료 2개
const SEED = [
  { id: "1", text: "장보기", completed: true },
  { id: "2", text: "청소하기", completed: false },
  { id: "3", text: "운동하기", completed: true },
  { id: "4", text: "책 읽기", completed: false },
]

const itemTexts = () =>
  screen.queryAllByRole("listitem").map((li) => li.textContent)
const storedIds = () =>
  JSON.parse(window.localStorage.getItem("todos")!).map(
    (t: { id: string }) => t.id
  )

describe("지운 할 일 되돌리기", () => {
  beforeEach(() => {
    window.localStorage.setItem("todos", JSON.stringify(SEED))
  })

  it("1. 할 일을 삭제하면 안내가 나오고, 되돌리기를 누르면 원래 자리로 돌아온다", async () => {
    const user = userEvent.setup()
    render(<TodoApp />)

    await user.click(screen.getByRole("button", { name: "청소하기 삭제" }))

    expect(itemTexts()).toEqual(["장보기", "운동하기", "책 읽기"])
    expect(screen.getByRole("status")).toHaveTextContent("“청소하기” 삭제함")

    await user.click(screen.getByRole("button", { name: "되돌리기" }))

    expect(itemTexts()).toEqual(["장보기", "청소하기", "운동하기", "책 읽기"])
    expect(storedIds()).toEqual(["1", "2", "3", "4"])
    expect(
      screen.queryByRole("button", { name: "되돌리기" })
    ).not.toBeInTheDocument()
  })

  it("2. 완료한 일 지우기도 되돌리면 지운 항목이 모두 원래 자리로 돌아온다", async () => {
    const user = userEvent.setup()
    render(<TodoApp />)

    await user.click(screen.getByRole("button", { name: /완료한 일 지우기/ }))

    expect(itemTexts()).toEqual(["청소하기", "책 읽기"])
    expect(screen.getByRole("status")).toHaveTextContent(
      "완료한 할 일 2개 지움"
    )

    await user.click(screen.getByRole("button", { name: "되돌리기" }))

    expect(storedIds()).toEqual(["1", "2", "3", "4"])
  })

  it("3. 지운 뒤 새 할 일을 추가해도 되돌리면 지운 항목만 다시 들어간다", async () => {
    const user = userEvent.setup()
    render(<TodoApp />)

    await user.click(screen.getByRole("button", { name: "운동하기 삭제" }))
    await user.type(
      screen.getByRole("textbox", { name: "새 할 일" }),
      "빨래하기{Enter}"
    )
    await user.click(screen.getByRole("button", { name: "되돌리기" }))

    expect(itemTexts()).toEqual([
      "빨래하기",
      "장보기",
      "청소하기",
      "운동하기",
      "책 읽기",
    ])
  })

  it("4. 아무것도 지우지 않았으면 안내가 비어 있다", () => {
    render(<TodoApp />)

    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })
})

describe("키보드로 할 일 수정", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "todos",
      JSON.stringify([
        { id: "1", text: "장보기", completed: false, date: todayKey() },
      ])
    )
  })

  it("수정 버튼을 키보드로 눌러 텍스트를 고칠 수 있다", async () => {
    const user = userEvent.setup()
    render(<TodoApp />)

    screen.getByRole("button", { name: "장보기 수정" }).focus()
    await user.keyboard("{Enter}")

    const editInput = screen.getByRole("textbox", { name: "할 일 수정" })
    expect(editInput).toHaveFocus()
    expect(
      screen.queryByRole("button", { name: "장보기 수정" })
    ).not.toBeInTheDocument()

    await user.clear(editInput)
    await user.type(editInput, "우유 사기{Enter}")

    expect(itemTexts()).toEqual(["우유 사기"])
  })
})
