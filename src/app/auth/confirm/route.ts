import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safeRedirect";

// Target of every Supabase auth link, in either of the two shapes this app
// produces:
//
//   ?code=...                    PKCE — used by links Supabase itself mails out
//                                (e.g. signup confirmation, password reset).
//   ?token_hash=...&type=invite  A link we minted ourselves via
//                                auth.admin.generateLink() in
//                                src/lib/actions/invite.ts. This project sends
//                                no email at all for invites: the admin copies
//                                the link out of the team page and hands it to
//                                the member however they like. Verifying the
//                                hash here is what turns it into a session.
//
// Either way the exchange must happen in a route handler, not a page, because
// only a route handler can write the session cookies before the destination
// renders.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Same reasoning as the sign-in action: this lands in a redirect the user
  // arrives at already authenticated, which is the most valuable moment to
  // hijack. Anything that isn't a path on this site becomes "/".
  const next = safeInternalPath(searchParams.get("next"), "/");

  const supabase = await createServerSupabaseClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invite_link_invalid`);
}
