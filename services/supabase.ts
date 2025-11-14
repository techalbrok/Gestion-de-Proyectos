import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aknlwslqabmcnvdqossa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbmx3c2xxYWJtY252ZHFvc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTkxMDUsImV4cCI6MjA3ODYzNTEwNX0.bTfFG6i98mG2Z1nx7e8vlsUyeeRHbJhtPOdbjbSevV8';

export const supabase = createClient(supabaseUrl, supabaseKey);
