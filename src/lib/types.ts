// ERD 기반 타입 정의
export interface User {
  id: number;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  gender: 'woman' | 'man';
  state: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Concert {
  id: number;
  title: string;
  description: string;
  location: string;
  location_X: number;
  location_y: number;
  start_date: Date;
  end_date: Date;
  rating: number;
  admin_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ConcertSchedule {
  id: number;
  concert_id: number;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Reservation {
  id: number;
  user_id: number;
  concert_id: number;
  ticket_count: number;
  state: 'RESERVED' | 'CANCELLED';
  created_at: Date;
}

export interface Admin {
  id: number;
  admin_id: string;
  password: string;
  phone: string;
  role: string;
  email: string;
  company: string;
  company_number: string;
  company_location: string;
  state: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}