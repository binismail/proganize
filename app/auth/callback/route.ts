import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log(request);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      console.log(forwardedHost);
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}`);
      } else if (forwardedHost && !forwardedHost.startsWith("localhost")) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Fallback to using the origin if forwardedHost is localhost or not set
        const fallbackDomain = process.env.NEXT_PUBLIC_BASE_URL || origin;
        return NextResponse.redirect(`${fallbackDomain}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}`);
}
