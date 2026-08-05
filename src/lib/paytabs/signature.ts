import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// PayTabs signs its responses two different ways, and mixing them up means the
// check silently never passes (or worse, is skipped). Both are HMAC-SHA256 with
// the profile's server key; what differs is *what* gets hashed.
//
//   1. Callback / IPN  — server-to-server POST, JSON body.
//      Signature arrives in the `signature` HTTP header and is the HMAC of the
//      RAW request body, byte for byte. It must be read before any JSON parse,
//      because re-serializing changes whitespace/key order and breaks the hash.
//
//   2. Return URL      — browser POST redirect, form-encoded body.
//      Signature arrives as a `signature` form field and is the HMAC of the
//      remaining fields: empties dropped, sorted by key, joined as a
//      URL-encoded query string.
//
// Everything here is constant-time on the comparison so a wrong signature can't
// be brute-forced by timing the response.

function safeEqualHex(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex.trim().toLowerCase(), "hex");

  // timingSafeEqual throws on length mismatch, and a length check is not itself
  // a secret leak (the digest length is public), so bail out first.
  if (expected.length === 0 || expected.length !== received.length) {
    return false;
  }
  return timingSafeEqual(expected, received);
}

/**
 * Verify a PayTabs callback (IPN). Pass the raw, unparsed request body.
 */
export function verifyCallbackSignature(
  rawBody: string,
  signatureHeader: string | null,
  serverKey: string
): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", serverKey).update(rawBody, "utf8").digest("hex");
  return safeEqualHex(expected, signatureHeader);
}

// PHP's urlencode(), which is what PayTabs' http_build_query() reference
// implementation uses. Differs from encodeURIComponent in two ways that matter:
// space becomes "+", and "~" is percent-encoded.
function phpUrlEncode(value: string): string {
  return Array.from(Buffer.from(value, "utf8"))
    .map((byte) => {
      const char = String.fromCharCode(byte);
      if (/[A-Za-z0-9\-_.]/.test(char)) return char;
      if (char === " ") return "+";
      return "%" + byte.toString(16).toUpperCase().padStart(2, "0");
    })
    .join("");
}

/**
 * Verify the signature on PayTabs' browser return POST.
 *
 * Note this is only used to decide whether the redirect is worth trusting for
 * display purposes. It never grants anything — fulfilment happens exclusively
 * in the callback handler.
 */
export function verifyReturnSignature(
  fields: Record<string, string>,
  serverKey: string
): boolean {
  const received = fields["signature"];
  if (!received) return false;

  const filtered = Object.entries(fields).filter(([key, value]) => {
    if (key === "signature") return false;
    // Mirrors PHP array_filter() with no callback, which drops every falsy
    // value — for form strings that means "" and, yes, the literal "0".
    return value !== "" && value !== "0";
  });

  filtered.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const query = filtered
    .map(([key, value]) => `${phpUrlEncode(key)}=${phpUrlEncode(value)}`)
    .join("&");

  const expected = createHmac("sha256", serverKey).update(query, "utf8").digest("hex");
  return safeEqualHex(expected, received);
}
