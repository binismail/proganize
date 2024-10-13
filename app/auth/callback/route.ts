import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // console.log(origin, ".....if.....");
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}`);
      } else if (forwardedHost) {
        console.log(forwardedHost, "........");
        console.log(origin, "......else if....");
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // console.log(origin, "......else....");
        return NextResponse.redirect(`${origin}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}`);
}
