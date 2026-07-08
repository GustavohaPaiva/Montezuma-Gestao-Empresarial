import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ficheiro frontend/.env (pode copiar frontend/.env.example). Depois reinicie o servidor (npm run dev).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
