'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfDay, isBefore } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { Service, Employee, WorkingHours, ScheduleException, Appointment } from '@/types/database.types'
import { getAvailableSlots, formatSlotTime, TimeSlot } from '@/lib/availability'
import { formatDuration, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const schema = z.object({
  customer_name: z.string().min(2, 'Full name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  service_id: z.string().min(1, 'Please select a service'),
  employee_id: z.string().min(1, 'Please select a staff member'),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EmployeeWithServices extends Employee {
  employee_services: { service_id: string }[]
}

interface Props {
  org: {
    id: string
    slug: string
    booking_window_days: number
    min_notice_hours: number
    timezone: string
    currency: string
  }
  services: Service[]
  employees: EmployeeWithServices[]
}

export function NewAppointmentForm({ org, services, employees }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithServices[]>(employees)

  const today = startOfDay(new Date())
  const maxDate = addDays(today, org.booking_window_days)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedServiceId = watch('service_id')
  const selectedEmployeeId = watch('employee_id')

  useEffect(() => {
    if (!selectedServiceId) {
      setFilteredEmployees(employees)
      return
    }
    const filtered = employees.filter(emp =>
      emp.employee_services.some(es => es.service_id === selectedServiceId)
    )
    setFilteredEmployees(filtered)
    setValue('employee_id', '')
    setSlots([])
    setSelectedSlot(null)
  }, [selectedServiceId, employees, setValue])

  useEffect(() => {
    if (selectedDate && selectedServiceId && selectedEmployeeId) {
      loadSlots(selectedDate, selectedServiceId, selectedEmployeeId)
    }
  }, [selectedDate, selectedServiceId, selectedEmployeeId])

  async function loadSlots(date: Date, serviceId: string, employeeId: string) {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)

    const service = services.find(s => s.id === serviceId)
    if (!service) { setLoadingSlots(false); return }

    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')
    const nextStr = format(addDays(date, 1), 'yyyy-MM-dd')

    const [{ data: wh }, { data: ex }, { data: appts }] = await Promise.all([
      supabase.from('working_hours').select('*').eq('employee_id', employeeId),
      supabase.from('schedule_exceptions').select('*').eq('employee_id', employeeId).eq('exception_date', dateStr),
      supabase.from('appointments').select('*').eq('employee_id', employeeId).gte('start_time', dateStr).lt('start_time', nextStr).neq('status', 'cancelled'),
    ])

    const available = getAvailableSlots({
      workingHours: (wh as WorkingHours[]) ?? [],
      exceptions: (ex as ScheduleException[]) ?? [],
      appointments: (appts as Appointment[]) ?? [],
      serviceDurationMinutes: service.duration_minutes,
      bufferAfterMinutes: service.buffer_after_minutes,
      date,
      minNoticeHours: org.min_notice_hours,
      bookingWindowDays: org.booking_window_days,
    })

    setSlots(available)
    setLoadingSlots(false)
  }

  async function onSubmit(data: FormValues) {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const [sh, sm] = selectedSlot.startTimeStr.split(':').map(Number)
    const [eh, em] = selectedSlot.endTimeStr.split(':').map(Number)
    const startDate = new Date(selectedDate)
    startDate.setHours(sh, sm, 0, 0)
    const endDate = new Date(selectedDate)
    endDate.setHours(eh, em, 0, 0)

    const { data: appt, error } = await supabase
      .from('appointments')
      .insert({
        organization_id: org.id,
        service_id: data.service_id,
        employee_id: data.employee_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create appointment: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Appointment created')
    router.push(`/dashboard/${org.slug}/appointments/${appt.id}`)
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const showDateTimePicker = !!selectedServiceId && !!selectedEmployeeId

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* Customer */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Customer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input placeholder="Sarah Johnson" {...register('customer_name')} />
            {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" {...register('customer_email')} />
            {errors.customer_email && <p className="text-xs text-destructive">{errors.customer_email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="+1 (555) 000-0000" {...register('customer_phone')} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Appointment */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Appointment</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Service</Label>
            <Select onValueChange={v => setValue('service_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name} — {formatDuration(s.duration_minutes)}
                      {s.price ? ` · ${formatCurrency(s.price, s.currency)}` : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_id && <p className="text-xs text-destructive">{errors.service_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Staff member</Label>
            <Select
              onValueChange={v => setValue('employee_id', v)}
              disabled={!selectedServiceId}
              key={selectedServiceId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedServiceId ? 'Select staff' : 'Select service first'} />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.display_name}{e.title ? ` — ${e.title}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && <p className="text-xs text-destructive">{errors.employee_id.message}</p>}
          </div>
        </div>

        {/* Date + time picker — shown once service and employee are selected */}
        {showDateTimePicker && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(d) => isBefore(d, today) || isBefore(maxDate, d)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col justify-start">
              {!selectedDate ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center min-h-[180px]">
                  Select a date to see available slots
                </div>
              ) : loadingSlots ? (
                <div className="h-full flex items-center justify-center min-h-[180px]">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center min-h-[180px]">
                  No availability on {format(selectedDate, 'MMM d')}.<br className="hidden sm:block" /> Try another date.
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-3">{format(selectedDate, 'EEEE, MMMM d')}</p>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {slots.map(slot => (
                      <button
                        type="button"
                        key={slot.startTimeStr}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                          selectedSlot?.startTimeStr === slot.startTimeStr
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-border hover:border-foreground/40 hover:bg-accent/30'
                        }`}
                      >
                        {formatSlotTime(slot.startTimeStr)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking summary */}
        {selectedSlot && selectedDate && selectedService && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {format(selectedDate, 'EEEE, MMMM d')} at {formatSlotTime(selectedSlot.startTimeStr)}
            </span>
            {' '}— {selectedService.name} · {formatDuration(selectedService.duration_minutes)}
          </div>
        )}
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Notes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Customer notes <span className="text-muted-foreground text-xs">(visible to customer)</span></Label>
            <Textarea
              placeholder="Any special requests or info from the customer…"
              rows={3}
              {...register('notes')}
            />
          </div>
          <div className="space-y-2">
            <Label>Internal notes <span className="text-muted-foreground text-xs">(staff only)</span></Label>
            <Textarea
              placeholder="Private notes for your team…"
              rows={3}
              {...register('internal_notes')}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/${org.slug}/appointments`}>Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedSlot || !selectedDate}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create appointment
        </Button>
      </div>
    </form>
  )
}
