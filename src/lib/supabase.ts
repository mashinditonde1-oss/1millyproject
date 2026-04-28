import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lyhthiygjmypbltbgmlb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_034Qa3kYMdyh_kFrxlFsCQ_EKDV2ba1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});