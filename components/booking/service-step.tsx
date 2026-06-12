'use client'

import { Service } from '@/types/database.types'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { Clock, DollarSign } from 'lucide-react'

interface Props {
  services: Service[]
  selected: Service | null
  onSelect: (service: Service) => void
}

export function ServiceStep({ services, selected, onSelect }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Select a service</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose the service you&apos;d like to book</p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No services available at this time.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={`text-left p-5 rounded-xl border transition-all ${selected?.id === service.id
                ? 'border-foreground bg-accent'
                : 'border-border hover:border-foreground/30 hover:bg-accent/30'
                }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: service.color + '25' }}
                >
                  <div className="w-full h-full rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(service.price, service.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
