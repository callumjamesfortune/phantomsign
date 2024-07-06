// lib/supabaseServerClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey);

export default supabaseServerClient;