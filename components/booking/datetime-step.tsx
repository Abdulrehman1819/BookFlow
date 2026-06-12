'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Organization, Service, Employee } from '@/types/database.types'
import { getAvailableSlots, formatSlotTime, TimeSlot } from '@/lib/availability'
import { WorkingHours, ScheduleException, Appointment } from '@/types/database.types'

interface Props {
  org: Organization
  service: Service
  employees: Employee[]
  selectedEmployee: Employee | null
  date: Date | null
  startTime: string | null
  onSelect: (date: Date, startTime: string, endTime: string, employee: Employee | null) => void
  onBack: () => void
}

export function DateTimeStep({ org, service, employees, selectedEmployee, date, startTime, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date ?? undefined)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const today = startOfDay(new Date())
  const maxDate = addDays(today, org.booking_window_days)

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate)
  }, [selectedDate])

  async function fetchSlots(date: Date) {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)

    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')
    const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd')

    const targetEmployees = selectedEmployee ? [selectedEmployee] : employees

    // Collect all slots across target employees, deduplicated by startTime
    const allSlots: Map<string, { slot: TimeSlot; employee: Employee }> = new Map()

    for (const emp of targetEmployees) {
      const [{ data: workingHours }, { data: exceptions }, { data: appointments }] = await Promise.all([
        supabase.from('working_hours').select('*').eq('employee_id', emp.id),
        supabase.from('schedule_exceptions').select('*').eq('employee_id', emp.id).eq('exception_date', dateStr),
        supabase.from('appointments').select('*').eq('employee_id', emp.id).gte('start_time', dateStr).lt('start_time', nextDateStr).neq('status', 'cancelled'),
      ])

      const empSlots = getAvailableSlots({
        workingHours: (workingHours as WorkingHours[]) ?? [],
        exceptions: (exceptions as ScheduleException[]) ?? [],
        appointments: (appointments as Appointment[]) ?? [],
        serviceDurationMinutes: service.duration_minutes,
        bufferAfterMinutes: service.buffer_after_minutes,
        date,
        minNoticeHours: org.min_notice_hours,
        bookingWindowDays: org.booking_window_days,
      })

      for (const slot of empSlots) {
        if (!allSlots.has(slot.startTimeStr)) {
          allSlots.set(slot.startTimeStr, { slot, employee: emp })
        }
      }
    }

    // Sort by time
    const sorted = Array.from(allSlots.values())
      .sort((a, b) => a.slot.startTimeStr.localeCompare(b.slot.startTimeStr))

    setSlots(sorted.map(({ slot }) => slot))
    setLoadingSlots(false)
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot)
  }

  function handleContinue() {
    if (!selectedDate || !selectedSlot) return

    // Find the employee for this slot
    const targetEmployee = selectedEmployee || employees[0] || null
    onSelect(selectedDate, selectedSlot.startTimeStr, selectedSlot.endTimeStr, targetEmployee)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Pick a date &amp; time</h2>
        <p className="text-muted-foreground text-sm mt-1">Select when you&apos;d like your appointment</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="border border-border rounded-xl p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => isBefore(date, today) || isBefore(maxDate, date)}
            className="w-full"
          />
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm border border-dashed border-border rounded-xl p-8">
              Select a date to see available times
            </div>
          ) : loadingSlots ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm border border-dashed border-border rounded-xl p-8 text-center">
              No availability on this date.<br />Please select another day.
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-3">
                {format(selectedDate, 'EEEE, MMMM d')}
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {slots.map(slot => (
                  <button
                    key={slot.startTimeStr}
                    onClick={() => handleSlotSelect(slot)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${selectedSlot?.startTimeStr === slot.startTimeStr
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

      <div className="flex items-center gap-3 mt-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedSlot}
          size="sm"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
