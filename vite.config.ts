import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ["@supabase/supabase-js", "@supabase/auth-js", "@supabase/realtime-js", "@supabase/postgrest-js", "@supabase/storage-js", "@supabase/functions-js", "@supabase/node-fetch"],
    },
  },
});
