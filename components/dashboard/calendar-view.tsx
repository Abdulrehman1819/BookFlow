'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  customer_name: string
  status: string
  service: { name: string; color: string; duration_minutes: number } | null
  employee: { display_name: string } | null
}

interface Props {
  appointments: Appointment[]
  employees: { id: string; display_name: string }[]
  orgSlug: string
  currentDate: string
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7am - 7pm

function getTopOffset(time: string): number {
  const date = parseISO(time)
  const h = date.getHours() - 7
  const m = date.getMinutes()
  return ((h * 60 + m) / (13 * 60)) * 100
}

function getHeight(startTime: string, endTime: string): number {
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  const durationMin = (end.getTime() - start.getTime()) / 60000
  return (durationMin / (13 * 60)) * 100
}

export function CalendarView({ appointments, orgSlug, currentDate }: Props) {
  const router = useRouter()
  const [viewDate, setViewDate] = useState(new Date(currentDate))

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  function navigate(direction: 'prev' | 'next') {
    const newDate = direction === 'prev' ? subWeeks(viewDate, 1) : addWeeks(viewDate, 1)
    setViewDate(newDate)
    router.push(`?date=${format(newDate, 'yyyy-MM-dd')}`)
  }

  function goToday() {
    setViewDate(today)
    router.push(`?date=${format(today, 'yyyy-MM-dd')}`)
  }

  function getAppointmentsForDay(day: Date) {
    return appointments.filter(a => isSameDay(parseISO(a.start_time), day))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm font-medium">
          {format(weekStart, 'MMMM yyyy')}
        </p>
      </div>

      {/* Calendar grid */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="border-r border-border" />
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={`px-2 py-3 text-center border-r border-border last:border-r-0 ${isSameDay(day, today) ? 'bg-accent' : ''}`}
            >
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={`text-sm font-medium mt-0.5 ${isSameDay(day, today) ? 'text-foreground' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </p>
              {/* Appointment count badge */}
              {getAppointmentsForDay(day).length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative overflow-y-auto max-h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            {/* Hours column */}
            <div className="border-r border-border">
              {HOURS.map(h => (
                <div key={h} className="h-14 border-b border-border px-2 flex items-start pt-1">
                  <span className="text-xs text-muted-foreground/70">
                    {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map(day => {
              const dayAppointments = getAppointmentsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`relative border-r border-border last:border-r-0 ${isSameDay(day, today) ? 'bg-accent/20' : ''}`}
                >
                  {/* Hour lines */}
                  {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-border/50" />
                  ))}

                  {/* Appointments */}
                  {dayAppointments.map(appt => {
                    if (appt.status === 'cancelled') return null
                    const top = getTopOffset(appt.start_time)
                    const height = Math.max(getHeight(appt.start_time, appt.end_time), 4)
                    return (
                      <Link
                        key={appt.id}
                        href={`/dashboard/${orgSlug}/appointments/${appt.id}`}
                        className="absolute left-1 right-1 rounded px-1.5 py-1 text-xs overflow-hidden hover:opacity-90 transition-opacity"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          backgroundColor: (appt.service?.color ?? '#6366f1') + '25',
                          borderLeft: `3px solid ${appt.service?.color ?? '#6366f1'}`,
                        }}
                      >
                        <p className="font-medium truncate text-foreground leading-tight">
                          {format(parseISO(appt.start_time), 'h:mm')} {appt.customer_name}
                        </p>
                        {height > 6 && (
                          <p className="text-muted-foreground truncate leading-tight mt-0.5">
                            {appt.service?.name}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground">
        {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} this week
      </div>
    </div>
  )
}
