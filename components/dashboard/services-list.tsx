'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Clock, DollarSign, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database.types'
import { formatCurrency, formatDuration, SERVICE_COLORS } from '@/lib/utils'

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_minutes: z.number().min(5, 'Minimum 5 minutes'),
  price: z.number().nullable().optional(),
  color: z.string(),
  buffer_after_minutes: z.number().min(0).optional(),
})

type ServiceForm = z.infer<typeof serviceSchema>

interface Props {
  services: Service[]
  orgId: string
  orgSlug: string
  currency: string
}

export function ServicesList({ services: initialServices, orgId, currency }: Props) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      color: SERVICE_COLORS[0],
      buffer_after_minutes: 0,
    },
  })

  const selectedColor = watch('color')

  function openCreate() {
    setEditing(null)
    reset({ color: SERVICE_COLORS[0], buffer_after_minutes: 0, duration_minutes: 60 })
    setOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    reset({
      name: service.name,
      description: service.description ?? '',
      duration_minutes: service.duration_minutes,
      price: service.price ?? undefined,
      color: service.color,
      buffer_after_minutes: service.buffer_after_minutes,
    })
    setOpen(true)
  }

  async function onSubmit(data: ServiceForm) {
    setLoading(true)
    const supabase = createClient()
    const payload = { ...data, price: data.price ?? null, buffer_after_minutes: data.buffer_after_minutes ?? 0 }

    if (editing) {
      const { data: updated, error } = await supabase
        .from('services')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update service')
      } else {
        setServices(prev => prev.map(s => s.id === editing.id ? updated : s))
        toast.success('Service updated')
        setOpen(false)
      }
    } else {
      const { data: created, error } = await supabase
        .from('services')
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create service')
      } else {
        setServices(prev => [...prev, created])
        toast.success('Service created')
        setOpen(false)
      }
    }

    setLoading(false)
    router.refresh()
  }

  async function toggleActive(service: Service) {
    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id)

    if (error) {
      toast.error('Failed to update service')
    } else {
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: !s.is_active } : s))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm mb-4">No services yet. Add your first service to start accepting bookings.</p>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add service
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <Card key={service.id} className={`border-border transition-opacity ${!service.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: service.color + '30' }}>
                      <div className="w-full h-full rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      {!service.is_active && <Badge variant="outline" className="text-xs mt-0.5">Inactive</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(service)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {service.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(service.price, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => toggleActive(service)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit service' : 'Add service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Service name</Label>
              <Input placeholder="e.g. Haircut, Consultation" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea placeholder="Brief description shown to customers..." rows={2} {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" min="5" step="5" {...register('duration_minutes', { valueAsNumber: true })} />
                {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Price (optional)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...register('price', { valueAsNumber: true, setValueAs: v => v === '' || isNaN(v) ? null : v })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Buffer after (min)</Label>
              <Input type="number" min="0" step="5" {...register('buffer_after_minutes', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {SERVICE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-7 h-7 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Save changes' : 'Create service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
