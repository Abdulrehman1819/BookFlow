import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { OverviewStats } from '@/components/dashboard/overview-stats'
import { TodaySchedule } from '@/components/dashboard/today-schedule'
import { QuickActions } from '@/components/dashboard/quick-actions'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function DashboardOverviewPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, timezone')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/dashboard')

  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()

  const [todayAppointments, monthAppointments, totalAppointments] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, service:services(name, price, duration_minutes), employee:employees(display_name)')
      .eq('organization_id', org.id)
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .neq('status', 'cancelled')
      .order('start_time'),
    supabase
      .from('appointments')
      .select('id, status, service:services(price)')
      .eq('organization_id', org.id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd)
      .neq('status', 'cancelled'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .neq('status', 'cancelled'),
  ])

  const todayCount = todayAppointments.data?.length ?? 0
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())

  const { data: weekAppointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', org.id)
    .gte('start_time', weekStart.toISOString())
    .lte('start_time', endOfDay(new Date(weekStart.getTime() + 6 * 86400000)).toISOString())
    .neq('status', 'cancelled')

  type MonthAppt = { id: string; status: string; service: { price: number | null } | null }
  const monthRevenue = ((monthAppointments.data ?? []) as MonthAppt[]).reduce((sum, a) => {
    return sum + (a.service?.price ?? 0)
  }, 0)

  const stats = {
    today: todayCount,
    thisWeek: weekAppointments?.length ?? 0,
    monthRevenue,
    totalAllTime: totalAppointments.count ?? 0,
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <OverviewStats stats={stats} />

      <div className="grid lg:grid-cols-3 gap-6 mt-6 md:mt-8">
        <div className="lg:col-span-2">
          <TodaySchedule appointments={todayAppointments.data ?? []} orgSlug={orgSlug} />
        </div>
        <div>
          <QuickActions orgSlug={orgSlug} bookingUrl={`/book/${orgSlug}`} />
        </div>
      </div>
    </div>
  )
}
