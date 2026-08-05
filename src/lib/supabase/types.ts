// Hand-written types mirroring supabase/migrations/*.sql. Keep in sync manually
// until a `supabase gen types` workflow is wired up.

export type PlanFeatures = {
  custom_branding: boolean;
  api_access: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  automated_marketing: boolean;
  lead_automation: boolean;
  dedicated_account_manager: boolean;
};

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_monthly_cents: number;
  description: string | null;
  max_listings: number | null;
  max_team_members: number | null;
  max_images_per_listing: number;
  features: PlanFeatures;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Organization = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  public_email: string | null;
  website_url: string | null;
  plan_id: string;
  plan_status: "active" | "past_due" | "canceled" | "trialing";
  created_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRole = "admin" | "member";

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  invited_email: string | null;
  status: "invited" | "active" | "suspended";
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyType =
  | "condo"
  | "apartment"
  | "villa"
  | "house"
  | "office"
  | "land"
  | "other";

export type PropertyStatus = "draft" | "published" | "archived";

export type Property = {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  price_period: "sale" | "month" | "year";
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  property_type: PropertyType;
  status: PropertyStatus;
  listed_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type PropertyImage = {
  id: string;
  property_id: string;
  organization_id: string;
  cloudinary_public_id: string;
  url: string;
  cloudinary_version: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  role: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PaymentTransactionStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "mismatch";

export type PaymentTransaction = {
  id: string;
  cart_id: string;
  tran_ref: string | null;
  user_id: string;
  intent: "signup" | "upgrade" | "renewal";
  organization_id: string | null;
  organization_name: string;
  organization_slug: string;
  plan_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentTransactionStatus;
  failure_reason: string | null;
  // PayTabs token captured off this transaction, if any (only present when
  // tokenise was requested and the card was successfully tokenised).
  token: string | null;
  paytabs_request: Record<string, unknown> | null;
  paytabs_callback: Record<string, unknown> | null;
  paytabs_query: Record<string, unknown> | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  last_payment_transaction_id: string | null;
  // Saved PayTabs card token, captured at checkout, used by the automatic
  // renewal cron to charge the next period without any user action.
  paytabs_token: string | null;
  next_renewal_attempt_at: string | null;
  failed_renewal_count: number;
  created_at: string;
  updated_at: string;
};

export type LeadStatus = "new" | "contacted" | "closed";

export type Lead = {
  id: string;
  organization_id: string;
  property_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};
