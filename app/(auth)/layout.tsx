import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-background" />
          </div>
          <span className="font-semibold tracking-tight">BookFlow</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  )
}
