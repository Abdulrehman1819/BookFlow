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
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Service { id: string; name: string; color: string }
interface EmployeeWithServices {
  id: string
  display_name: string
  title: string | null
  bio: string | null
  is_accepting_bookings: boolean
  employee_services: { service_id: string; service: Service | null }[]
}

const employeeSchema = z.object({
  display_name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  bio: z.string().optional(),
})

type EmployeeForm = z.infer<typeof employeeSchema>

interface Props {
  employees: EmployeeWithServices[]
  services: Service[]
  orgId: string
  orgSlug: string
}

export function StaffList({ employees: initialEmployees, services, orgId }: Props) {
  const router = useRouter()
  const [employees, setEmployees] = useState(initialEmployees)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeWithServices | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
  })

  function openCreate() {
    setEditing(null)
    setSelectedServices([])
    reset({ display_name: '', title: '', bio: '' })
    setOpen(true)
  }

  function openEdit(emp: EmployeeWithServices) {
    setEditing(emp)
    setSelectedServices(emp.employee_services.map(es => es.service_id))
    reset({ display_name: emp.display_name, title: emp.title ?? '', bio: emp.bio ?? '' })
    setOpen(true)
  }

  function toggleService(serviceId: string) {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  async function onSubmit(data: EmployeeForm) {
    setLoading(true)
    const supabase = createClient()

    if (editing) {
      // Update employee
      const { error } = await supabase
        .from('employees')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editing.id)

      if (error) {
        toast.error('Failed to update staff member')
        setLoading(false)
        return
      }

      // Update services
      await supabase.from('employee_services').delete().eq('employee_id', editing.id)
      if (selectedServices.length > 0) {
        await supabase.from('employee_services').insert(
          selectedServices.map(sid => ({ employee_id: editing.id, service_id: sid }))
        )
      }

      toast.success('Staff member updated')
    } else {
      const { data: emp, error } = await supabase
        .from('employees')
        .insert({ ...data, organization_id: orgId, is_accepting_bookings: true })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create staff member')
        setLoading(false)
        return
      }

      if (selectedServices.length > 0) {
        await supabase.from('employee_services').insert(
          selectedServices.map(sid => ({ employee_id: emp.id, service_id: sid }))
        )
      }

      toast.success('Staff member added')
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function toggleAccepting(emp: EmployeeWithServices) {
    const supabase = createClient()
    await supabase
      .from('employees')
      .update({ is_accepting_bookings: !emp.is_accepting_bookings })
      .eq('id', emp.id)
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_accepting_bookings: !e.is_accepting_bookings } : e))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add staff member
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm mb-4">No staff members yet.</p>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add staff member
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <Card key={emp.id} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm">{getInitials(emp.display_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{emp.display_name}</p>
                      {emp.title && <p className="text-xs text-muted-foreground">{emp.title}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(emp)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {emp.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{emp.bio}</p>}
                {emp.employee_services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {emp.employee_services.slice(0, 3).map(es => es.service && (
                      <Badge key={es.service_id} variant="outline" className="text-xs py-0">
                        {es.service.name}
                      </Badge>
                    ))}
                    {emp.employee_services.length > 3 && (
                      <Badge variant="outline" className="text-xs py-0">+{emp.employee_services.length - 3}</Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Accepting bookings</span>
                  <Switch
                    checked={emp.is_accepting_bookings}
                    onCheckedChange={() => toggleAccepting(emp)}
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
            <DialogTitle>{editing ? 'Edit staff member' : 'Add staff member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input placeholder="Sarah Johnson" {...register('display_name')} />
              {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Title <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Senior Stylist, Therapist" {...register('title')} />
            </div>
            <div className="space-y-2">
              <Label>Bio <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea placeholder="Brief bio shown to customers..." rows={2} {...register('bio')} />
            </div>
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Services they can perform</Label>
                <div className="space-y-2">
                  {services.map(service => (
                    <div key={service.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                        <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                          {service.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Save changes' : 'Add staff member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
