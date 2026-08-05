import "server-only";

// Every `next=` destination in this app arrives from somewhere the user can
// edit: a query string on /login, a query string on /auth/confirm, a hidden
// form field. Handing one of those straight to redirect() turns the sign-in
// page into an open redirect — `/login?next=https://evil.example` produces a
// real login on our domain that lands the user on someone else's, which is the
// exact shape a credential-phishing link wants.
//
// So: only same-site absolute paths survive. Everything else falls back.
export function safeInternalPath(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value) return fallback;

  const candidate = value.trim();

  // Must be an absolute path on this site. "//host" and "/\host" are
  // protocol-relative URLs that browsers happily treat as another origin, so
  // the second character matters as much as the first.
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;

  // Control characters — CR and LF above all — are header-splitting material,
  // never part of a real destination.
  for (let i = 0; i < candidate.length; i++) {
    const code = candidate.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return fallback;
  }

  return candidate;
}
