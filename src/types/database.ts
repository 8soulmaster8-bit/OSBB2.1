export interface Profile {
  id: string;
  full_name: string;
  apartment_number: string;
  phone: string | null;
  role: 'user' | 'admin';
  square_meters: number;
  created_at: string;
}

export interface Meter {
  id: string;
  user_id: string;
  type: 'water' | 'hot_water' | 'cold_water' | 'electricity' | 'gas';
  current_reading: number;
  reading_date: string;
  created_at: string;
  profiles?: Profile;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading: number;
  reading_date: string;
  submitted_at: string;
  meters?: Meter;
}

export interface Bill {
  id: string;
  user_id: string;
  month: string;
  amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
  profiles?: Profile;
}

export interface MaintenanceRequest {
  id: string;
  user_id: string;
  topic: string;
  description: string | null;
  status: 'new' | 'in_progress' | 'completed';
  master: string | null;
  created_at: string;
  profiles?: Profile;
}

export type RequestStatus = 'new' | 'in_progress' | 'completed';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'В обработке',
  in_progress: 'Мастер назначен',
  completed: 'Выполнено',
};
