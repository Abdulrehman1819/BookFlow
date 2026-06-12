export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          phone: string | null
          avatar_url: string | null
          is_super_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          phone?: string | null
          avatar_url?: string | null
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          phone?: string | null
          avatar_url?: string | null
          is_super_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          business_type: string
          logo_url: string | null
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          country: string | null
          timezone: string
          currency: string
          booking_window_days: number
          min_notice_hours: number
          cancellation_hours: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          business_type: string
          logo_url?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          timezone?: string
          currency?: string
          booking_window_days?: number
          min_notice_hours?: number
          cancellation_hours?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          business_type?: string
          logo_url?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          timezone?: string
          currency?: string
          booking_window_days?: number
          min_notice_hours?: number
          cancellation_hours?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'staff' | 'customer'
          is_active: boolean
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'staff' | 'customer'
          is_active?: boolean
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'staff' | 'customer'
          is_active?: boolean
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number | null
          currency: string
          color: string
          buffer_after_minutes: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price?: number | null
          currency?: string
          color?: string
          buffer_after_minutes?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number | null
          currency?: string
          color?: string
          buffer_after_minutes?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          display_name: string
          title: string | null
          bio: string | null
          avatar_url: string | null
          is_accepting_bookings: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          display_name: string
          title?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_accepting_bookings?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string | null
          display_name?: string
          title?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_accepting_bookings?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      employee_services: {
        Row: {
          employee_id: string
          service_id: string
        }
        Insert: {
          employee_id: string
          service_id: string
        }
        Update: {
          employee_id?: string
          service_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          id: string
          organization_id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
        }
        Update: {
          start_time?: string
          end_time?: string
          is_active?: boolean
        }
        Relationships: []
      }
      schedule_exceptions: {
        Row: {
          id: string
          organization_id: string
          employee_id: string | null
          exception_date: string
          is_day_off: boolean
          start_time: string | null
          end_time: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id?: string | null
          exception_date: string
          is_day_off?: boolean
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          is_day_off?: boolean
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          organization_id: string
          service_id: string
          employee_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          notes: string | null
          internal_notes: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          reminder_24h_sent: boolean
          reminder_1h_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          service_id: string
          employee_id: string
          customer_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          reminder_24h_sent?: boolean
          reminder_1h_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          reminder_24h_sent?: boolean
          reminder_1h_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type Service = Tables<'services'>
export type Employee = Tables<'employees'>
export type EmployeeService = Tables<'employee_services'>
export type WorkingHours = Tables<'working_hours'>
export type ScheduleException = Tables<'schedule_exceptions'>
export type Appointment = Tables<'appointments'>

export type AppointmentStatus = Appointment['status']
export type MemberRole = OrganizationMember['role']

export type AppointmentWithRelations = Appointment & {
  service: Service
  employee: Employee
}

export type EmployeeWithServices = Employee & {
  employee_services: { service: Service }[]
  working_hours: WorkingHours[]
}
