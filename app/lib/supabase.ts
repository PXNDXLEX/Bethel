import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus credenciales de Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'tu-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
