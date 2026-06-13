import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AppointmentActions } from '@/components/dashboard/appointment-actions'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { Appointment } from '@/types/database.types'

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

type ApptDetail = Appointment & {
  service: {
    name: string
    duration_minutes: number
    price: number | null
    currency: string
    color: string
    description: string | null
  } | null
  employee: { display_name: string; title: string | null } | null
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  pending: 'outline',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'outline',
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { orgSlug, id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('appointments')
    .select(`*, service:services(name, duration_minutes, price, currency, color, description), employee:employees(display_name, title)`)
    .eq('id', id)
    .single()

  const appt = data as ApptDetail | null
  if (!appt) notFound()

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
          <Link href={`/dashboard/${orgSlug}/appointments`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to appointments
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">{appt.customer_name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Appointment #{id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={STATUS_BADGE[appt.status] ?? 'outline'} className="capitalize">
              {appt.status}
            </Badge>
            <AppointmentActions appointment={appt} orgSlug={orgSlug} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {appt.service && (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: appt.service.color + '20' }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: appt.service.color }} />
                  </div>
                )}
                <div>
                  <p className="font-medium">{appt.service?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(appt.service?.duration_minutes ?? 0)} · {formatCurrency(appt.service?.price ?? null, appt.service?.currency)}
                  </p>
                </div>
              </div>
              {appt.service?.description && (
                <p className="text-sm text-muted-foreground">{appt.service.description}</p>
              )}
              <Separator />
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(parseISO(appt.start_time), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(appt.start_time), 'h:mm a')} – {format(parseISO(appt.end_time), 'h:mm a')}
                  </span>
                </div>
                {appt.employee && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{appt.employee.display_name}{appt.employee.title ? ` · ${appt.employee.title}` : ''}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {appt.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Customer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{appt.notes}</p>
              </CardContent>
            </Card>
          )}

          {appt.status === 'cancelled' && appt.cancellation_reason && (
            <Card className="border-destructive/30">
              <CardContent className="pt-5">
                <p className="text-sm font-medium text-destructive mb-1">Cancellation reason</p>
                <p className="text-sm text-muted-foreground">{appt.cancellation_reason}</p>
                {appt.cancelled_by && (
                  <p className="text-xs text-muted-foreground/70 mt-1">Cancelled by: {appt.cancelled_by}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {appt.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-sm">{appt.customer_name}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{appt.customer_email}</span>
                </div>
                {appt.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{appt.customer_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Booked</span>
                <span>{format(parseISO(appt.created_at), 'MMM d, h:mm a')}</span>
              </div>
              {appt.updated_at !== appt.created_at && (
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>{format(parseISO(appt.updated_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
