import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (
    fileEnv.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim();
  const supabaseKey = (
    fileEnv.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (mode === "production" && (!supabaseUrl || !supabaseKey)) {
    throw new Error(
      "Build de produção exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (frontend/.env ou secrets do GitHub Actions).",
    );
  }

  return {
    plugins: [react()],
    base: "/",
  };
});
