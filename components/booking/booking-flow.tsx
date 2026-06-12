'use client'

import { useState } from 'react'
import { Organization, Service, Employee } from '@/types/database.types'
import { ServiceStep } from './service-step'
import { StaffStep } from './staff-step'
import { DateTimeStep } from './datetime-step'
import { DetailsStep } from './details-step'
import { ConfirmationStep } from './confirmation-step'

interface EmployeeWithServices extends Employee {
  employee_services: { service_id: string }[]
}

interface Props {
  org: Organization
  services: Service[]
  employees: EmployeeWithServices[]
}

export interface BookingState {
  service: Service | null
  employee: Employee | null
  anyEmployee: boolean
  date: Date | null
  startTime: string | null
  endTime: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
}

const STEPS = ['Service', 'Staff', 'Date & Time', 'Details']

export function BookingFlow({ org, services, employees }: Props) {
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string>('')
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    employee: null,
    anyEmployee: true,
    date: null,
    startTime: null,
    endTime: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  })

  function update(partial: Partial<BookingState>) {
    setBooking(prev => ({ ...prev, ...partial }))
  }

  if (confirmed) {
    return (
      <ConfirmationStep
        booking={booking}
        org={org}
        appointmentId={appointmentId}
      />
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-sm ${step >= i ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border transition-all ${step > i ? 'bg-foreground text-background border-foreground' : step === i ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className="hidden sm:inline text-sm">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 sm:w-12 transition-all ${step > i ? 'bg-foreground' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <ServiceStep
          services={services}
          selected={booking.service}
          onSelect={service => { update({ service }); setStep(1) }}
        />
      )}

      {step === 1 && (
        <StaffStep
          employees={employees.filter(e =>
            !booking.service || e.employee_services.some(es => es.service_id === booking.service!.id)
          )}
          selected={booking.employee}
          anyEmployee={booking.anyEmployee}
          onSelect={(employee, any) => { update({ employee, anyEmployee: any }); setStep(2) }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && booking.service && (
        <DateTimeStep
          org={org}
          service={booking.service}
          employees={employees.filter(e =>
            e.employee_services.some(es => es.service_id === booking.service!.id)
          )}
          selectedEmployee={booking.anyEmployee ? null : booking.employee}
          date={booking.date}
          startTime={booking.startTime}
          onSelect={(date, startTime, endTime, employee) => {
            update({ date, startTime, endTime, employee: employee || booking.employee })
            setStep(3)
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <DetailsStep
          booking={booking}
          org={org}
          onBack={() => setStep(2)}
          onConfirm={(id) => {
            setAppointmentId(id)
            setConfirmed(true)
          }}
        />
      )}
    </div>
  )
}
