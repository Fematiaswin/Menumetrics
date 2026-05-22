import { redirect } from "next/navigation";

import { isDemoModeEnabled } from "@/lib/demo-mode";
import { getCurrentUser } from "@/lib/supabase/app-server";

export default async function HomePage() {
  if (isDemoModeEnabled()) redirect("/demo");

  const { user } = await getCurrentUser();
  redirect(user ? "/app" : "/login");
}
