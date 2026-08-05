import "server-only";
import { getSiteUrl } from "@/lib/siteUrl";

// PayTabs credentials. All three are secrets — none of them may ever be
// prefixed NEXT_PUBLIC_ or referenced from a client component. The server key
// in particular is the HMAC key used to authenticate callbacks; leaking it
// means anyone can forge a "payment succeeded" callback.
//
// PAYTABS_REGION picks the endpoint. Using the wrong region for your profile
// produces auth failures that look like bad credentials.
const REGION_DOMAINS = {
  ksa: "https://secure.paytabs.sa",
  global: "https://secure.paytabs.com",
  egypt: "https://secure-egypt.paytabs.com",
  oman: "https://secure-oman.paytabs.com",
  jordan: "https://secure-jordan.paytabs.com",
  kuwait: "https://secure-kuwait.paytabs.com",
  uae: "https://secure.paytabs.com",
  // Derived from the merchant dashboard domain (merchant-turkiye.paytabs.com):
  // swap "merchant" -> "secure", per PayTabs' own "what is my endpoint" rule.
  turkiye: "https://secure-turkiye.paytabs.com",
} as const;

export type PayTabsRegion = keyof typeof REGION_DOMAINS;

export type PayTabsConfig = {
  profileId: string;
  serverKey: string;
  baseUrl: string;
  currency: string;
  siteUrl: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. PayTabs checkout cannot run without it — add it to .env.local.`
    );
  }
  return value;
}

export function getPayTabsConfig(): PayTabsConfig {
  const region = (process.env.PAYTABS_REGION ?? "global").toLowerCase();
  const baseUrl = REGION_DOMAINS[region as PayTabsRegion];

  if (!baseUrl) {
    throw new Error(
      `Unknown PAYTABS_REGION "${region}". Expected one of: ${Object.keys(REGION_DOMAINS).join(", ")}.`
    );
  }

  // Currency is fixed by configuration, never taken from the request. It is
  // stored on the transaction row at checkout and re-checked against PayTabs'
  // own record before anything is granted. Must match a currency your PayTabs
  // profile is actually provisioned for — PayTabs returns HTTP 400 "Currency
  // not available" otherwise. TRY isn't in PayTabs' standard MENA lineup;
  // if this profile hasn't had it explicitly enabled, email
  // customercare@paytabs.com with the profile ID to request it.
  const currency = (process.env.PAYTABS_CURRENCY ?? "TRY").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`PAYTABS_CURRENCY must be a 3-letter ISO code, got "${currency}".`);
  }

  return {
    profileId: required("PAYTABS_PROFILE_ID"),
    serverKey: required("PAYTABS_SERVER_KEY"),
    baseUrl,
    currency,
    siteUrl: getSiteUrl(),
  };
}
