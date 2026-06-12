import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', membership.organization_id)
    .single()

  if (org?.slug) {
    redirect(`/dashboard/${org.slug}`)
  }

  redirect('/onboarding')

}
