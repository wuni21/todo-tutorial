import Link from "next/link"
import { ChartColumnIcon } from "lucide-react"

import { TodoApp } from "@/components/todo-app"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Todo</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Status">
          <Link href="/status">
            <ChartColumnIcon />
          </Link>
        </Button>
      </div>
      <TodoApp />
    </main>
  )
}
