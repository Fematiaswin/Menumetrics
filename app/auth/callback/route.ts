import { NextResponse, type NextRequest } from "next/server";

import { createAppSupabaseClient } from "@/lib/supabase/app-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createAppSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
