'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Loader2, ChevronRight, ChevronLeft, Building2, Wrench, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_TYPES, TIMEZONES, slugify, DAY_NAMES } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

const orgSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(1, 'Please select a business type'),
  timezone: z.string().min(1, 'Please select your timezone'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.number().optional(),
})

type OrgData = z.infer<typeof orgSchema>
type ServiceData = z.infer<typeof serviceSchema>

const DEFAULT_HOURS = {
  start: '09:00',
  end: '18:00',
}

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'First Service', icon: Wrench },
  { id: 3, label: 'Working Hours', icon: Clock },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  const [workingDays, setWorkingDays] = useState<Record<number, { active: boolean; start: string; end: string }>>({
    0: { active: false, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    1: { active: true, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    2: { active: true, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    3: { active: true, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    4: { active: true, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    5: { active: true, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
    6: { active: false, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end },
  })

  const orgForm = useForm<OrgData>({
    resolver: zodResolver(orgSchema),
    defaultValues: { timezone: 'America/New_York' },
  })
  const serviceForm = useForm<ServiceData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { duration: 60, price: undefined },
  })

  async function handleOrgSubmit(data: OrgData) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = slugify(data.name) + '-' + Math.random().toString(36).slice(2, 6)

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        slug,
        name: data.name,
        business_type: data.businessType,
        timezone: data.timezone,
        phone: data.phone || null,
        address: data.address || null,
      })
      .select()
      .single()

    if (orgError) {
      toast.error('Failed to create organization: ' + orgError.message)
      setLoading(false)
      return
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      toast.error('Failed to set up membership: ' + memberError.message)
      setLoading(false)
      return
    }

    // Create employee record for the owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        display_name: profile?.full_name || user.email?.split('@')[0] || 'Owner',
        is_accepting_bookings: true,
      })
      .select()
      .single()

    if (empError) {
      toast.error('Failed to create employee record')
      setLoading(false)
      return
    }

    setOrgId(org.id)
    setOrgSlug(org.slug)
    setEmployeeId(employee.id)
    setLoading(false)
    setStep(2)
  }

  async function handleServiceSubmit(data: ServiceData) {
    if (!orgId) return
    setLoading(true)
    const supabase = createClient()

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        organization_id: orgId,
        name: data.name,
        duration_minutes: data.duration,
        price: data.price ?? null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create service: ' + error.message)
      setLoading(false)
      return
    }

    // Link service to owner-employee
    if (employeeId) {
      await supabase.from('employee_services').insert({
        employee_id: employeeId,
        service_id: service.id,
      })
    }

    setLoading(false)
    setStep(3)
  }

  async function handleHoursSubmit() {
    if (!orgId || !employeeId) return
    setLoading(true)
    const supabase = createClient()

    const hoursToInsert = Object.entries(workingDays)
      .filter(([, v]) => v.active)
      .map(([day, v]) => ({
        organization_id: orgId,
        employee_id: employeeId,
        day_of_week: Number(day),
        start_time: v.start,
        end_time: v.end,
        is_active: true,
      }))

    if (hoursToInsert.length > 0) {
      const { error } = await supabase.from('working_hours').insert(hoursToInsert)
      if (error) {
        toast.error('Failed to save working hours')
        setLoading(false)
        return
      }
    }

    toast.success('Setup complete! Welcome to BookFlow.')
    router.push(`/dashboard/${orgSlug}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-background" />
        </div>
        <span className="font-semibold tracking-tight">BookFlow</span>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${step > s.id ? 'bg-foreground text-background border-foreground' : step === s.id ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${step > s.id ? 'bg-foreground' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight mb-2">Tell us about your business</h1>
              <p className="text-muted-foreground text-sm">This information will appear on your booking page.</p>
            </div>
            <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input placeholder="Glow & Go Studio" {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{orgForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Business type</Label>
                <Select onValueChange={v => orgForm.setValue('businessType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {orgForm.formState.errors.businessType && (
                  <p className="text-xs text-destructive">{orgForm.formState.errors.businessType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select onValueChange={v => orgForm.setValue('timezone', v)} defaultValue="America/New_York">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="+1 (555) 000-0000" {...orgForm.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Address <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="123 Main St, New York, NY" {...orgForm.register('address')} />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: First Service */}
        {step === 2 && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight mb-2">Add your first service</h1>
              <p className="text-muted-foreground text-sm">You can add more services from your dashboard later.</p>
            </div>
            <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label>Service name</Label>
                <Input placeholder="e.g. Haircut, Consultation, Massage" {...serviceForm.register('name')} />
                {serviceForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{serviceForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="60"
                    {...serviceForm.register('duration', { valueAsNumber: true })}
                  />
                  {serviceForm.formState.errors.duration && (
                    <p className="text-xs text-destructive">{serviceForm.formState.errors.duration.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Price (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    {...serviceForm.register('price', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                Skip for now
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Working Hours */}
        {step === 3 && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight mb-2">Set your working hours</h1>
              <p className="text-muted-foreground text-sm">Customers will only be able to book during these times.</p>
            </div>
            <div className="space-y-3">
              {Object.entries(workingDays).map(([day, config]) => (
                <div key={day} className="py-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={config.active}
                      onCheckedChange={val =>
                        setWorkingDays(prev => ({ ...prev, [day]: { ...prev[Number(day)], active: val } }))
                      }
                    />
                    <span className={`text-sm font-medium w-24 shrink-0 ${config.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {DAY_NAMES[Number(day)]}
                    </span>
                    {!config.active && (
                      <span className="text-sm text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                  {config.active && (
                    <div className="flex items-center gap-2 mt-2 ml-[52px]">
                      <Input
                        type="time"
                        value={config.start}
                        onChange={e => setWorkingDays(prev => ({
                          ...prev,
                          [day]: { ...prev[Number(day)], start: e.target.value },
                        }))}
                        className="text-sm h-8"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">–</span>
                      <Input
                        type="time"
                        value={config.end}
                        onChange={e => setWorkingDays(prev => ({
                          ...prev,
                          [day]: { ...prev[Number(day)], end: e.target.value },
                        }))}
                        className="text-sm h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleHoursSubmit} className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
