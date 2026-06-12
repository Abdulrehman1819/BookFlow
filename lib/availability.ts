import { WorkingHours, ScheduleException, Appointment } from '@/types/database.types'
import { addMinutes, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns'

interface SlotInput {
  workingHours: WorkingHours[]
  exceptions: ScheduleException[]
  appointments: Appointment[]
  serviceDurationMinutes: number
  bufferAfterMinutes: number
  date: Date
  minNoticeHours: number
  bookingWindowDays: number
  slotIntervalMinutes?: number
}

export interface TimeSlot {
  startTime: Date
  endTime: Date
  startTimeStr: string
  endTimeStr: string
}

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function getAvailableSlots(input: SlotInput): TimeSlot[] {
  const {
    workingHours,
    exceptions,
    appointments,
    serviceDurationMinutes,
    bufferAfterMinutes,
    date,
    minNoticeHours,
    bookingWindowDays,
    slotIntervalMinutes = 15,
  } = input

  const dayOfWeek = date.getDay()
  const dateStr = format(date, 'yyyy-MM-dd')

  // Check booking window
  const now = new Date()
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + bookingWindowDays)
  if (isAfter(startOfDay(date), startOfDay(maxDate))) return []
  if (isBefore(startOfDay(date), startOfDay(now))) return []

  // Find working hours for this day
  const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active)
  if (!dayHours) return []

  // Check exceptions
  const dayExceptions = exceptions.filter(e => e.exception_date === dateStr)
  const fullDayOff = dayExceptions.some(e => e.is_day_off && !e.start_time)
  if (fullDayOff) return []

  let workStart = timeStringToMinutes(dayHours.start_time)
  let workEnd = timeStringToMinutes(dayHours.end_time)

  // Apply partial-day exceptions (blocked time ranges)
  const blockedRanges: { start: number; end: number }[] = []
  for (const exc of dayExceptions) {
    if (exc.is_day_off && exc.start_time && exc.end_time) {
      blockedRanges.push({
        start: timeStringToMinutes(exc.start_time),
        end: timeStringToMinutes(exc.end_time),
      })
    }
  }

  // Build occupied ranges from existing appointments
  const dateAppointments = appointments.filter(a => {
    const apptDate = format(parseISO(a.start_time), 'yyyy-MM-dd')
    return apptDate === dateStr && (a.status === 'confirmed' || a.status === 'pending')
  })

  const occupiedRanges = dateAppointments.map(a => {
    const start = new Date(a.start_time)
    const end = new Date(a.end_time)
    const startMins = start.getHours() * 60 + start.getMinutes()
    // end + buffer
    const endMins = end.getHours() * 60 + end.getMinutes() + bufferAfterMinutes
    return { start: startMins, end: endMins }
  })

  // Generate candidate slots
  const slots: TimeSlot[] = []
  const totalDuration = serviceDurationMinutes + bufferAfterMinutes
  const minNoticeMinutes = minNoticeHours * 60
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + minNoticeMinutes

  let cursor = workStart
  while (cursor + serviceDurationMinutes <= workEnd) {
    const slotStart = cursor
    const slotEnd = cursor + serviceDurationMinutes

    // Skip if in the past (for today)
    const isToday = dateStr === format(now, 'yyyy-MM-dd')
    if (isToday && slotStart < nowMinutes) {
      cursor += slotIntervalMinutes
      continue
    }

    // Check against blocked exception ranges
    const blockedByException = blockedRanges.some(
      r => slotStart < r.end && slotEnd > r.start
    )
    if (blockedByException) {
      cursor += slotIntervalMinutes
      continue
    }

    // Check against occupied appointment ranges
    const blocked = occupiedRanges.some(
      r => slotStart < r.end && slotEnd > r.start
    )

    if (!blocked) {
      const startDate = new Date(date)
      startDate.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0)
      const endDate = addMinutes(startDate, serviceDurationMinutes)

      slots.push({
        startTime: startDate,
        endTime: endDate,
        startTimeStr: minutesToTimeString(slotStart),
        endTimeStr: minutesToTimeString(slotStart + serviceDurationMinutes),
      })
    }

    cursor += slotIntervalMinutes
  }

  return slots
}

export function formatSlotTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
