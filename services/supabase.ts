import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://vtnuirobrtswsjoxkkpl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bnVpcm9icnRzd3Nqb3hra3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTkyOTAsImV4cCI6MjA4OTA5NTI5MH0.PVdzHnmCHcJlHRRQf-HuQFcty6DgAQMczuxT97cCN88';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
