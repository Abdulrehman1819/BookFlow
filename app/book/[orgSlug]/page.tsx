import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingFlow } from '@/components/booking/booking-flow'
import { CalendarDays, MapPin, Phone } from 'lucide-react'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function BookingPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single()

  if (!org) notFound()

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-background" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{org.name}</p>
              {(org.city || org.business_type) && (
                <p className="text-xs text-muted-foreground capitalize">
                  {org.city && <span className="flex items-center gap-1 inline-flex"><MapPin className="w-3 h-3" />{org.city}</span>}
                  {org.city && org.business_type && ' · '}
                  {org.business_type}
                </p>
              )}
            </div>
          </div>
          {org.phone && (
            <a href={`tel:${org.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {org.phone}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BookingFlow
          org={org}
          services={services ?? []}
          employees={employees ?? []}
        />
      </main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          Powered by <span className="font-medium text-foreground">BookFlow</span>
        </div>
      </footer>
    </div>
  )
}
