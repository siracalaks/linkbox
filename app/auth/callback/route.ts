import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/** Magic link / e-posta doğrulama dönüşü: auth kodunu oturuma çevirir. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
