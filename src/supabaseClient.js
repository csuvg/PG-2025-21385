import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://dkvovlqrlwbhkqffuydj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdm92bHFybHdiaGtxZmZ1eWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjk5ODIsImV4cCI6MjA3Njg0NTk4Mn0.DgJjzW5xevKfDsMBJ8BjRRC5zf5ZcSw2mHPpxVm2180';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;