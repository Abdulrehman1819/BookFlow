import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface Appointment {
  id: string
  customer_name: string
  start_time: string
  end_time: string
  status: string
  service: { name: string; duration_minutes: number } | null
  employee: { display_name: string } | null
}

interface Props {
  appointments: Appointment[]
  orgSlug: string
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function TodaySchedule({ appointments, orgSlug }: Props) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-medium">Today&apos;s Schedule</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
          <Link href={`/dashboard/${orgSlug}/appointments`}>
            View all <ArrowRight className="ml-1 w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No appointments today</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Enjoy the free time!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <Link
                key={appt.id}
                href={`/dashboard/${orgSlug}/appointments/${appt.id}`}
                className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
              >
                <div className="text-right min-w-[56px]">
                  <p className="text-sm font-medium tabular-nums">
                    {format(parseISO(appt.start_time), 'h:mm')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(appt.start_time), 'a')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{appt.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.service?.name} · {formatDuration(appt.service?.duration_minutes ?? 0)}
                    {appt.employee && ` · ${appt.employee.display_name}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize flex-shrink-0 ${STATUS_STYLES[appt.status] || ''}`}>
                  {appt.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
