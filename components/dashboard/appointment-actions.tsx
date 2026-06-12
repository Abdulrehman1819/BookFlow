'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, XCircle, UserX, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  appointment: { id: string; status: string }
  orgSlug: string
}

export function AppointmentActions({ appointment, orgSlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  type ApptStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'

  async function updateStatus(status: ApptStatus, extra?: Record<string, string>) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('id', appointment.id)

    if (error) {
      toast.error('Failed to update appointment')
    } else {
      toast.success(`Appointment marked as ${status}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleCancel() {
    await updateStatus('cancelled', {
      cancellation_reason: cancelReason,
      cancelled_by: 'staff',
    })
    setShowCancelDialog(false)
    setCancelReason('')
  }

  if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {appointment.status !== 'completed' && (
            <DropdownMenuItem onClick={() => updateStatus('completed' as const)}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Mark as completed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => updateStatus('no_show' as const)}>
            <UserX className="w-4 h-4 mr-2 text-yellow-600" />
            Mark as no-show
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCancelDialog(true)}
            className="text-destructive"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel appointment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>
              This will cancel the appointment. The customer will not be automatically notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Staff unavailable, emergency closure..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep appointment</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
