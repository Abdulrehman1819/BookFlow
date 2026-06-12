'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  start_time: string
  end_time: string
  status: string
  service: { name: string; duration_minutes: number; color: string } | null
  employee: { display_name: string } | null
}

interface Props {
  appointments: Appointment[]
  orgSlug: string
  total: number
  page: number
  pageSize: number
  currentStatus: string
}

const STATUS_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  confirmed: { variant: 'default', label: 'Confirmed' },
  pending: { variant: 'outline', label: 'Pending' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  no_show: { variant: 'outline', label: 'No Show' },
}

export function AppointmentsTable({ appointments, orgSlug, total, page, pageSize, currentStatus }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / pageSize)

  function setStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', status)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={currentStatus} onValueChange={setStatus}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-medium text-xs">Customer</TableHead>
              <TableHead className="font-medium text-xs">Service</TableHead>
              <TableHead className="font-medium text-xs">Staff</TableHead>
              <TableHead className="font-medium text-xs">Date & Time</TableHead>
              <TableHead className="font-medium text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              appointments.map(appt => {
                const badge = STATUS_BADGE[appt.status] || { variant: 'outline' as const, label: appt.status }
                return (
                  <TableRow key={appt.id} className="cursor-pointer hover:bg-accent/20">
                    <TableCell>
                      <Link href={`/dashboard/${orgSlug}/appointments/${appt.id}`} className="block">
                        <p className="text-sm font-medium">{appt.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{appt.customer_email}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {appt.service && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: appt.service.color }}
                          />
                        )}
                        <div>
                          <p className="text-sm">{appt.service?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {appt.service ? formatDuration(appt.service.duration_minutes) : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{appt.employee?.display_name ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm tabular-nums">
                        {format(parseISO(appt.start_time), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {format(parseISO(appt.start_time), 'h:mm a')} – {format(parseISO(appt.end_time), 'h:mm a')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
