import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqbgzmfkrqhyocaueowc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYmd6bWZrcnFoeW9jYXVlb3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTkwNjgsImV4cCI6MjA3NDczNTA2OH0.nstF5XSJxVs8V6Sh0iGJWKkPzUyTW3gGfJZ7EBt5CGs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);