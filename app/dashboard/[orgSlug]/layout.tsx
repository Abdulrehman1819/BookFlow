import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

interface Props {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        org={org}
        role={membership.role}
        user={{ email: user.email!, ...profile }}
      />
      <main className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
