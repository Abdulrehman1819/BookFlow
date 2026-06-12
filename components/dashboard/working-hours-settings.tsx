'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WorkingHours } from '@/types/database.types'
import { DAY_NAMES } from '@/lib/utils'

interface Props {
  employeeId: string
  organizationId: string
  workingHours: WorkingHours[]
}

type DayConfig = { active: boolean; start: string; end: string; existingId?: string }

function buildDayMap(workingHours: WorkingHours[]): Record<number, DayConfig> {
  const map: Record<number, DayConfig> = {}
  for (let i = 0; i < 7; i++) {
    const existing = workingHours.find(wh => wh.day_of_week === i)
    map[i] = existing
      ? { active: existing.is_active, start: existing.start_time, end: existing.end_time, existingId: existing.id }
      : { active: i >= 1 && i <= 5, start: '09:00', end: '18:00' }
  }
  return map
}

export function WorkingHoursSettings({ employeeId, organizationId, workingHours }: Props) {
  const [days, setDays] = useState<Record<number, DayConfig>>(buildDayMap(workingHours))
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()

    for (const [dayStr, config] of Object.entries(days)) {
      const day = Number(dayStr)
      const existing = config.existingId

      if (existing) {
        await supabase
          .from('working_hours')
          .update({ is_active: config.active, start_time: config.start, end_time: config.end })
          .eq('id', existing)
      } else if (config.active) {
        await supabase
          .from('working_hours')
          .insert({
            organization_id: organizationId,
            employee_id: employeeId,
            day_of_week: day,
            start_time: config.start,
            end_time: config.end,
            is_active: true,
          })
      }
    }

    toast.success('Working hours saved')
    setLoading(false)
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base font-medium">Working Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(days).map(([dayStr, config]) => {
          const day = Number(dayStr)
          return (
            <div key={day} className="flex items-center gap-4">
              <Switch
                checked={config.active}
                onCheckedChange={val =>
                  setDays(prev => ({ ...prev, [day]: { ...prev[day], active: val } }))
                }
              />
              <span className={`text-sm w-24 ${config.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {DAY_NAMES[day]}
              </span>
              {config.active ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={config.start}
                    onChange={e => setDays(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                    className="text-sm"
                  />
                  <span className="text-muted-foreground text-sm shrink-0">to</span>
                  <Input
                    type="time"
                    value={config.end}
                    onChange={e => setDays(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                    className="text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground flex-1">Unavailable</span>
              )}
            </div>
          )
        })}
        <Button onClick={handleSave} disabled={loading} className="mt-2">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save hours
        </Button>
      </CardContent>
    </Card>
  )
}
