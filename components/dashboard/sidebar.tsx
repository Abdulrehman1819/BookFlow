'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, LayoutDashboard, Calendar, BookOpen, Wrench, Users, Settings, LogOut, ExternalLink, ChevronDown } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/types/database.types'
import { toast } from 'sonner'

interface SidebarProps {
  org: Organization
  role: string
  user: { email: string; full_name?: string | null; avatar_url?: string | null }
}

export function DashboardSidebar({ org, role, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const base = `/dashboard/${org.slug}`

  const navItems = [
    { href: base, label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: `${base}/appointments`, label: 'Appointments', icon: BookOpen },
    { href: `${base}/calendar`, label: 'Calendar', icon: Calendar },
    ...(role === 'owner' ? [
      { href: `${base}/services`, label: 'Services', icon: Wrench },
      { href: `${base}/staff`, label: 'Staff', icon: Users },
    ] : []),
    { href: `${base}/settings`, label: 'Settings', icon: Settings },
  ]

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const displayName = user.full_name || user.email.split('@')[0]

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo + Org */}
      <div className="px-4 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
            <CalendarDays className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">BookFlow</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{org.business_type}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Booking link */}
      <div className="px-3 pb-3">
        <Link
          href={`/book/${org.slug}`}
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View booking page
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full rounded-md px-2 py-2 hover:bg-accent/50 transition-colors text-left">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/${org.slug}/settings`}>Account settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
