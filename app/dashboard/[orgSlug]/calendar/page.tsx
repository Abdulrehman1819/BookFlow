import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/dashboard/calendar-view'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { date } = await searchParams

  const supabase = await createClient()
  const { data: org } = await supabase.from('organizations').select('id, timezone').eq('slug', orgSlug).single()
  if (!org) redirect('/dashboard')

  const viewDate = date ? new Date(date) : new Date()
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 })

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, service:services(name, color, duration_minutes), employee:employees(display_name)')
    .eq('organization_id', org.id)
    .gte('start_time', weekStart.toISOString())
    .lte('start_time', weekEnd.toISOString())
    .neq('status', 'cancelled')
    .order('start_time')

  const { data: employees } = await supabase
    .from('employees')
    .select('id, display_name')
    .eq('organization_id', org.id)
    .eq('is_accepting_bookings', true)

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Week of {format(weekStart, 'MMMM d')} – {format(weekEnd, 'MMMM d, yyyy')}
        </p>
      </div>
      <CalendarView
        appointments={appointments ?? []}
        employees={employees ?? []}
        orgSlug={orgSlug}
        currentDate={viewDate.toISOString()}
      />
    </div>
  )
}
