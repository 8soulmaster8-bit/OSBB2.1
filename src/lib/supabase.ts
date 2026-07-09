import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  apartment_number: string
  phone: string | null
  role: 'user' | 'admin'
  square_meters: number
  tenant_id: string | null
  is_super_admin: boolean | null
  created_at: string
}

export type Bill = {
  id: string
  user_id: string
  month: string
  amount: number
  status: 'paid' | 'unpaid'
  created_at: string
  tenant_id: string | null
}

export type Meter = {
  id: string
  user_id: string
  type: 'water' | 'hot_water' | 'cold_water' | 'electricity' | 'gas'
  current_reading: number
  reading_date: string
  created_at: string
  tenant_id: string | null
}

export type MeterReading = {
  id: string
  meter_id: string
  reading: number
  reading_date: string
  submitted_at: string
}

export type Request = {
  id: string
  user_id: string
  topic: string
  description: string | null
  status: 'new' | 'in_progress' | 'completed'
  master: string | null
  created_at: string
  tenant_id: string | null
}
