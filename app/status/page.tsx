import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { StatusView } from "@/components/status-view"
import { Button } from "@/components/ui/button"

export default function StatusPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Status</h1>
        <Button asChild variant="ghost" size="icon" aria-label="할 일 목록으로">
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
      </div>
      <StatusView />
    </main>
  )
}
