import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrganizationSettingsForm } from '@/components/dashboard/org-settings-form'
import { WorkingHoursSettings } from '@/components/dashboard/working-hours-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/dashboard')

  const { data: { user } } = await supabase.auth.getUser()

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('organization_id', org.id)
    .eq('user_id', user!.id)
    .single()

  const { data: workingHours } = employee
    ? await supabase
        .from('working_hours')
        .select('*')
        .eq('employee_id', employee.id)
        .order('day_of_week')
    : { data: [] }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your business configuration.</p>
      </div>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Working Hours</TabsTrigger>
          <TabsTrigger value="booking">Booking Policy</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <OrganizationSettingsForm org={org} />
        </TabsContent>
        <TabsContent value="hours">
          {employee ? (
            <WorkingHoursSettings
              employeeId={employee.id}
              organizationId={org.id}
              workingHours={workingHours ?? []}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No employee record found for your account.</p>
          )}
        </TabsContent>
        <TabsContent value="booking">
          <OrganizationSettingsForm org={org} bookingPolicy />
        </TabsContent>
      </Tabs>
    </div>
  )
}
