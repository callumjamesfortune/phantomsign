import { User } from "@supabase/auth-helpers-nextjs";

export interface EmailStats {
    generated_inboxes_count: number | null;
    codes_found_count: number | null;
    links_found_count: number | null;
  }
  
export interface LandingClientProps {
    user: User | null;
    emailStats: EmailStats | null;
    inboxFromCookie: string | null;
  }