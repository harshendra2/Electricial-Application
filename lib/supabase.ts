import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Bill = {
  id: string;
  bill_number: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  bill_date: string;
  notes: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type BillItem = {
  id: string;
  bill_id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  item_order: number;
  created_at: string;
};
