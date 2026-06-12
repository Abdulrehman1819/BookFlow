'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/types/database.types'
import { BUSINESS_TYPES, TIMEZONES } from '@/lib/utils'

const generalSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  business_type: z.string(),
  timezone: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

const bookingSchema = z.object({
  booking_window_days: z.number().min(1).max(365),
  min_notice_hours: z.number().min(0).max(168),
  cancellation_hours: z.number().min(0).max(168),
})

type GeneralForm = z.infer<typeof generalSchema>
type BookingForm = z.infer<typeof bookingSchema>

interface Props {
  org: Organization
  bookingPolicy?: boolean
}

export function OrganizationSettingsForm({ org, bookingPolicy }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const generalForm = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: org.name,
      description: org.description ?? '',
      business_type: org.business_type,
      timezone: org.timezone,
      phone: org.phone ?? '',
      email: org.email ?? '',
      website: org.website ?? '',
      address: org.address ?? '',
      city: org.city ?? '',
      country: org.country ?? '',
    },
  })

  const bookingForm = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      booking_window_days: org.booking_window_days,
      min_notice_hours: org.min_notice_hours,
      cancellation_hours: org.cancellation_hours,
    },
  })

  async function onGeneralSubmit(data: GeneralForm) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', org.id)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved')
      router.refresh()
    }
    setLoading(false)
  }

  async function onBookingSubmit(data: BookingForm) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', org.id)

    if (error) {
      toast.error('Failed to save booking policy')
    } else {
      toast.success('Booking policy saved')
    }
    setLoading(false)
  }

  if (bookingPolicy) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Booking Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Booking window (days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                {...bookingForm.register('booking_window_days', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">How far in advance customers can book</p>
            </div>
            <div className="space-y-2">
              <Label>Minimum notice (hours)</Label>
              <Input
                type="number"
                min="0"
                max="168"
                {...bookingForm.register('min_notice_hours', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Minimum hours notice required for a booking</p>
            </div>
            <div className="space-y-2">
              <Label>Cancellation window (hours)</Label>
              <Input
                type="number"
                min="0"
                max="168"
                {...bookingForm.register('cancellation_hours', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Customers can cancel up to this many hours before their appointment</p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save policy
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base font-medium">Business Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input {...generalForm.register('name')} />
            {generalForm.formState.errors.name && (
              <p className="text-xs text-destructive">{generalForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={2} {...generalForm.register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business type</Label>
              <Select
                defaultValue={org.business_type}
                onValueChange={v => generalForm.setValue('business_type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                defaultValue={org.timezone}
                onValueChange={v => generalForm.setValue('timezone', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...generalForm.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...generalForm.register('email')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input placeholder="https://" {...generalForm.register('website')} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...generalForm.register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...generalForm.register('city')} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...generalForm.register('country')} />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
