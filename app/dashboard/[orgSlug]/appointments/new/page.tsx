import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewAppointmentForm } from '@/components/dashboard/new-appointment-form'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function NewAppointmentPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, booking_window_days, min_notice_hours, timezone, currency')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/dashboard')

  const [{ data: services }, { data: employees }] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('employees')
      .select('*, employee_services(service_id)')
      .eq('organization_id', org.id)
      .eq('is_accepting_bookings', true)
      .order('display_name'),
  ])

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href={`/dashboard/${orgSlug}/appointments`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to appointments
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manually create an appointment for a customer.
        </p>
      </div>

      {services?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl max-w-md">
          <p className="text-muted-foreground text-sm mb-4">
            You need at least one active service before creating appointments.
          </p>
          <Button size="sm" asChild>
            <Link href={`/dashboard/${orgSlug}/services`}>Go to Services</Link>
          </Button>
        </div>
      ) : (
        <NewAppointmentForm
          org={org}
          services={services ?? []}
          employees={employees ?? []}
        />
      )}
    </div>
  )
}
