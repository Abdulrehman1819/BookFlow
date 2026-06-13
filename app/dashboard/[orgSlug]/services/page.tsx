import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServicesList } from '@/components/dashboard/services-list'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function ServicesPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id, currency').eq('slug', orgSlug).single()
  if (!org) redirect('/dashboard')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at')

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Services</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define what your business offers and how long each service takes.
        </p>
      </div>
      <ServicesList services={services ?? []} orgId={org.id} orgSlug={orgSlug} currency={org.currency} />
    </div>
  )
}
