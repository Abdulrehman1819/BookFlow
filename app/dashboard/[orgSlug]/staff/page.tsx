import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffList } from '@/components/dashboard/staff-list'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function StaffPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) redirect('/dashboard')

  const [{ data: employees }, { data: services }] = await Promise.all([
    supabase
      .from('employees')
      .select('*, employee_services(service_id, service:services(id, name, color))')
      .eq('organization_id', org.id)
      .order('created_at'),
    supabase
      .from('services')
      .select('id, name, color')
      .eq('organization_id', org.id)
      .eq('is_active', true),
  ])

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your team members and their services.
        </p>
      </div>
      <StaffList
        employees={employees ?? []}
        services={services ?? []}
        orgId={org.id}
        orgSlug={orgSlug}
      />
    </div>
  )
}
