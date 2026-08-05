import "server-only";

// Single source of truth for "where does this deployment live".
//
// Three things are built from it and all three are silently, expensively wrong
// if it points somewhere the buyer's browser can't reach:
//
//   - the PayTabs `return` URL   — buyer is dropped on a dead page after paying
//   - the PayTabs `callback` URL — PayTabs cannot reach us, so a real payment
//                                  never becomes a subscription
//   - invite links               — handed to a member, and useless
//
// Getting a localhost URL into production therefore means taking money and
// granting nothing, with no error anywhere. The old `?? "http://localhost:3000"`
// default made that the *automatic* outcome of a missing env var, so this
// throws instead: a build/boot failure is recoverable, a silent one is not.
// Development keeps the convenient default.
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is not set. It is the public origin used for PayTabs return/callback URLs and invite links — without it, payments cannot be confirmed."
      );
    }
    return "http://localhost:3000";
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not a valid absolute URL: "${configured}". Expected something like https://app.example.com.`
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be http or https, got "${parsed.protocol}".`
    );
  }

  // PayTabs cannot reach a loopback address, and neither can an invited member
  // on another machine. In development that's the whole point; in production
  // it is the failure this module exists to prevent.
  const isLoopback =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";

  if (isLoopback && process.env.NODE_ENV === "production") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL points at ${parsed.hostname}, which PayTabs cannot reach. Set it to the deployment's public origin.`
    );
  }

  // Normalise away a trailing slash so callers can concatenate paths freely.
  return configured.replace(/\/+$/, "");
}
