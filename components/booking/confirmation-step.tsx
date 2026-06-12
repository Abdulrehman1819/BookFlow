'use client'

import { format } from 'date-fns'
import { CheckCircle, Calendar, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Organization } from '@/types/database.types'
import { BookingState } from './booking-flow'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { formatSlotTime } from '@/lib/availability'

interface Props {
  booking: BookingState
  org: Organization
  appointmentId: string
}

export function ConfirmationStep({ booking, org, appointmentId }: Props) {
  return (
    <div className="max-w-md mx-auto text-center py-6">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-7 h-7 text-foreground" />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-2">You&apos;re booked!</h2>
      <p className="text-muted-foreground text-sm mb-6">
        A confirmation has been sent to <strong>{booking.customerEmail}</strong>
      </p>

      <div className="p-5 rounded-xl border border-border text-left space-y-4 mb-6">
        <p className="text-sm font-medium">Appointment details</p>
        <Separator />

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 mt-0.5 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: booking.service?.color }} />
            </div>
            <div>
              <p className="font-medium">{booking.service?.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatDuration(booking.service?.duration_minutes ?? 0)} · {formatCurrency(booking.service?.price ?? null, booking.service?.currency)}
              </p>
            </div>
          </div>

          {booking.date && booking.startTime && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{format(booking.date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          )}

          {booking.startTime && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>
                {formatSlotTime(booking.startTime)}
                {booking.endTime && ` – ${formatSlotTime(booking.endTime)}`}
              </span>
            </div>
          )}

          {booking.employee && (
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{booking.employee.display_name}</span>
            </div>
          )}

          {org.address && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{org.address}{org.city ? `, ${org.city}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Confirmation #{appointmentId.slice(0, 8).toUpperCase()}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          size="sm"
        >
          Book another appointment
        </Button>
      </div>
    </div>
  )
}
