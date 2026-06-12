'use client'

import { Employee } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Props {
  employees: Employee[]
  selected: Employee | null
  anyEmployee: boolean
  onSelect: (employee: Employee | null, any: boolean) => void
  onBack: () => void
}

export function StaffStep({ employees, selected, anyEmployee, onSelect, onBack }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Select staff</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose a specific team member or let us assign the first available</p>
      </div>

      <div className="space-y-3">
        {/* Any available option */}
        <button
          onClick={() => onSelect(null, true)}
          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${anyEmployee && !selected
            ? 'border-foreground bg-accent'
            : 'border-border hover:border-foreground/30 hover:bg-accent/30'
            }`}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Any available</p>
            <p className="text-xs text-muted-foreground">We&apos;ll assign the first available team member</p>
          </div>
        </button>

        {employees.map(emp => (
          <button
            key={emp.id}
            onClick={() => onSelect(emp, false)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${!anyEmployee && selected?.id === emp.id
              ? 'border-foreground bg-accent'
              : 'border-border hover:border-foreground/30 hover:bg-accent/30'
              }`}
          >
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="text-sm">{getInitials(emp.display_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{emp.display_name}</p>
              {emp.title && <p className="text-xs text-muted-foreground">{emp.title}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>
    </div>
  )
}
