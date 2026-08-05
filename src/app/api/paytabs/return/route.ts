import type { NextRequest } from "next/server";
import { getPayTabsConfig } from "@/lib/paytabs/config";
import { verifyReturnSignature } from "@/lib/paytabs/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// PayTabs browser return URL.
//
// This endpoint grants NOTHING. It exists only because PayTabs sends the buyer
// back with an HTTP POST, which a page component cannot receive — so it takes
// the POST and 303-redirects to the status screen.
//
// Whether the subscription is active is decided entirely by the server-to-server
// callback handler. The status screen reads that decision out of our own
// database; it does not read anything out of this redirect. A buyer who
// hand-crafts a POST here with respStatus=A gets a status page that still says
// "pending", because nothing in this file writes to the database.
//
// The signature is still verified, purely so we don't render a cart id that
// didn't come from PayTabs.
// ---------------------------------------------------------------------------

function redirectTo(path: string, siteUrl: string) {
  // 303 forces the browser to follow up with GET instead of replaying the POST.
  return Response.redirect(new URL(path, siteUrl), 303);
}

export async function POST(request: NextRequest) {
  const config = getPayTabsConfig();

  const form = await request.formData();
  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  const cartId = fields["cartId"] ?? fields["cart_id"] ?? "";

  if (!verifyReturnSignature(fields, config.serverKey)) {
    console.warn("[paytabs] return redirect failed signature check");
    return redirectTo("/signup/payment/status", config.siteUrl);
  }

  return redirectTo(
    `/signup/payment/status?cart=${encodeURIComponent(cartId)}`,
    config.siteUrl
  );
}

// Some PayTabs configurations return via GET (e.g. cancelled payments).
export async function GET(request: NextRequest) {
  const config = getPayTabsConfig();
  const cartId = request.nextUrl.searchParams.get("cartId") ?? "";

  return redirectTo(
    cartId
      ? `/signup/payment/status?cart=${encodeURIComponent(cartId)}`
      : "/signup/payment/status",
    config.siteUrl
  );
}
