import { createClient } from "@supabase/supabase-js";

export function createRouteSupabaseClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const authorization = request.headers.get("authorization");

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authorization ? { Authorization: authorization } : {}
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function requireUser(request: Request) {
  const supabase = createRouteSupabaseClient(request);
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}
