import { createClient } from "@supabase/supabase-js";

// This is the public browser key. Never place a Supabase secret/service_role key here.
export const supabase = createClient(
  "https://gpnaotmyvryyhdpixdfl.supabase.co",
  "sb_publishable_JJMsd1uGpG4ImdIp8_mWBw_lYyr8biz"
);

export const usernameEmail = (username) => `${username.toLowerCase().trim()}@medify.local`;
