'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  orgSlug: string
  bookingUrl: string
}

export function QuickActions({ orgSlug, bookingUrl }: Props) {
  function copyBookingLink() {
    const url = `${window.location.origin}${bookingUrl}`
    navigator.clipboard.writeText(url)
    toast.success('Booking link copied!')
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9" asChild>
          <Link href={`/dashboard/${orgSlug}/appointments/new`}>
            <Plus className="w-4 h-4" />
            New appointment
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-sm h-9"
          onClick={copyBookingLink}
        >
          <Copy className="w-4 h-4" />
          Copy booking link
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9" asChild>
          <Link href={bookingUrl} target="_blank">
            <ExternalLink className="w-4 h-4" />
            View booking page
          </Link>
        </Button>
      </CardContent>

      {/* Booking link display */}
      <div className="mx-4 mb-4 p-3 rounded-lg bg-muted border border-border">
        <p className="text-xs text-muted-foreground mb-1">Your booking link</p>
        <p className="text-xs font-mono text-foreground break-all">
          {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}{bookingUrl}
        </p>
      </div>
    </Card>
  )
}
