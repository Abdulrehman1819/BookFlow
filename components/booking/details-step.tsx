'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Loader2, Calendar, Clock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Organization } from '@/types/database.types'
import { BookingState } from './booking-flow'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { formatSlotTime as fmtSlot } from '@/lib/availability'

interface Props {
  booking: BookingState
  org: Organization
  onBack: () => void
  onConfirm: (appointmentId: string) => void
}

const schema = z.object({
  customerName: z.string().min(2, 'Please enter your full name'),
  customerEmail: z.string().email('Please enter a valid email'),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function DetailsStep({ booking, org, onBack, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      notes: booking.notes,
    },
  })

  async function onSubmit(data: FormData) {
    if (!booking.service || !booking.date || !booking.startTime || !booking.employee) {
      toast.error('Missing booking information')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Build start and end datetimes in ISO format
    const [startH, startM] = booking.startTime.split(':').map(Number)
    const [endH, endM] = booking.endTime!.split(':').map(Number)

    const startDate = new Date(booking.date)
    startDate.setHours(startH, startM, 0, 0)
    const endDate = new Date(booking.date)
    endDate.setHours(endH, endM, 0, 0)

    // Get current user (optional — for linking to customer account)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        organization_id: org.id,
        service_id: booking.service.id,
        employee_id: booking.employee.id,
        customer_id: user?.id ?? null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: data.notes || null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to book appointment. Please try again.')
      setLoading(false)
      return
    }

    onConfirm(appointment.id)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Your details</h2>
        <p className="text-muted-foreground text-sm mt-1">Almost there — just fill in your contact information</p>
      </div>

      {/* Booking summary */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6 space-y-2">
        <p className="text-sm font-medium mb-3">Booking summary</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: booking.service?.color }} />
          <span>{booking.service?.name}</span>
          <span>·</span>
          <span>{formatDuration(booking.service?.duration_minutes ?? 0)}</span>
          <span>·</span>
          <span>{formatCurrency(booking.service?.price ?? null, booking.service?.currency)}</span>
        </div>
        {booking.date && booking.startTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(booking.date, 'EEEE, MMMM d, yyyy')}</span>
            <span>·</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{fmtSlot(booking.startTime)}</span>
          </div>
        )}
        {booking.employee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>{booking.employee.display_name}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input placeholder="Sarah Johnson" {...register('customerName')} />
            {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" {...register('customerEmail')} />
            {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Phone <span className="text-muted-foreground">(optional)</span></Label>
          <Input placeholder="+1 (555) 000-0000" {...register('customerPhone')} />
        </div>
        <div className="space-y-2">
          <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea placeholder="Any special requests or information..." rows={3} {...register('notes')} />
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm appointment
          </Button>
        </div>
      </form>
    </div>
  )
}
