"use client";

import { createBrowserClient } from "@supabase/ssr";

// helpers for browser/client-side components
export const createBrowserSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Export a singleton for use in client components
export const browserSupabase = createBrowserSupabaseClient();