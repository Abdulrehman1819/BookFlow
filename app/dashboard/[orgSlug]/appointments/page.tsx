import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentsTable } from '@/components/dashboard/appointments-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AppointmentsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { status, page } = await searchParams

  const supabase = await createClient()
  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) redirect('/dashboard')

  const pageNum = Math.max(1, parseInt(page ?? '1'))
  const pageSize = 20
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('appointments')
    .select('*, service:services(name, duration_minutes, color), employee:employees(display_name)', { count: 'exact' })
    .eq('organization_id', org.id)
    .order('start_time', { ascending: false })
    .range(from, to)

  const validStatuses = ['pending', 'confirmed', 'cancelled', 'no_show', 'completed'] as const
  type ValidStatus = typeof validStatuses[number]

  if (status && status !== 'all' && validStatuses.includes(status as ValidStatus)) {
    query = query.eq('status', status as ValidStatus)
  }

  const { data, count } = await query

  type ApptRow = {
    id: string
    customer_name: string
    customer_email: string
    start_time: string
    end_time: string
    status: string
    service: { name: string; duration_minutes: number; color: string } | null
    employee: { display_name: string } | null
  }
  const appointments = (data ?? []) as ApptRow[]

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} total appointments
          </p>
        </div>
        <Button size="sm" asChild className="flex-shrink-0">
          <Link href={`/dashboard/${orgSlug}/appointments/new`}>
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New appointment</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>
      <AppointmentsTable
        appointments={appointments ?? []}
        orgSlug={orgSlug}
        total={count ?? 0}
        page={pageNum}
        pageSize={pageSize}
        currentStatus={status ?? 'all'}
      />
    </div>
  )
}
