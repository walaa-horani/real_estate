-- Local dev seed data. Run automatically by `supabase db reset`.

insert into public.plans
  (slug, name, price_monthly_cents, description, max_listings, max_team_members, max_images_per_listing, features, sort_order)
values
  (
    'basic', 'Basic', 4900,
    'Everything a small agency needs to get listed online.',
    50, 2, 6,
    '{"custom_branding": false, "api_access": false, "advanced_analytics": false, "priority_support": false, "automated_marketing": false, "lead_automation": false, "dedicated_account_manager": false}'::jsonb,
    1
  ),
  (
    'pro', 'Pro', 9900,
    'Growing agencies that need automation and insight.',
    250, 10, 15,
    '{"custom_branding": false, "api_access": false, "advanced_analytics": true, "priority_support": true, "automated_marketing": true, "lead_automation": true, "dedicated_account_manager": false}'::jsonb,
    2
  ),
  (
    'enterprise', 'Enterprise', 19900,
    'Unlimited scale, branding, and a dedicated account manager.',
    null, null, 30,
    '{"custom_branding": true, "api_access": true, "advanced_analytics": true, "priority_support": true, "automated_marketing": true, "lead_automation": true, "dedicated_account_manager": true}'::jsonb,
    3
  );

-- Demo organization matching the current UI mockup (Skyline Properties).
-- No demo auth.users/owner membership is seeded here: creating auth.users
-- directly via SQL is unreliable across Supabase versions. After
-- `supabase start`, create a test user via Studio or the Auth API, then call
-- select public.create_organization_with_owner('skyline-properties', 'Skyline Properties', 'enterprise');
-- to attach it as owner of this demo org, or just re-run that RPC to create
-- your own fresh demo org end-to-end.

do $$
declare
  demo_org_id uuid;
  enterprise_plan_id uuid;
  penthouse_id uuid;
  villa_id uuid;
  loft_id uuid;
begin
  select id into enterprise_plan_id from public.plans where slug = 'enterprise';

  insert into public.organizations (slug, name, description, address, phone, public_email, plan_id, is_public)
  values (
    'skyline-properties', 'Skyline Properties',
    'Premier real estate agency specializing in luxury Manhattan properties.',
    '350 5th Ave, New York, NY', '+1 (212) 555-0100', 'hello@skylineproperties.example',
    enterprise_plan_id, true
  )
  returning id into demo_org_id;

  insert into public.properties
    (organization_id, slug, title, description, price, price_period, address_line, city, state, postal_code, beds, baths, sqft, property_type, status, published_at)
  values
    (
      demo_org_id, 'modern-penthouse', 'Modern Penthouse in Manhattan',
      'A stunning penthouse with panoramic skyline views, floor-to-ceiling windows, and a private terrace.',
      4250000, 'sale', '350 5th Ave, Unit PH', 'New York', 'NY', '10118',
      3, 2.5, 2500, 'condo', 'published', now()
    )
    returning id into penthouse_id;

  insert into public.properties
    (organization_id, slug, title, description, price, price_period, address_line, city, state, postal_code, beds, baths, sqft, property_type, status, published_at)
  values
    (
      demo_org_id, 'luxury-villa', 'Luxury Villa with Private Pool',
      'Spacious villa featuring a private pool, landscaped garden, and five-star finishes throughout.',
      6800000, 'sale', '12 Ocean Dr', 'Miami', 'FL', '33139',
      5, 4.5, 5200, 'villa', 'published', now()
    )
    returning id into villa_id;

  insert into public.properties
    (organization_id, slug, title, description, price, price_period, address_line, city, state, postal_code, beds, baths, sqft, property_type, status)
  values
    (
      demo_org_id, 'loft-office', 'Creative Loft Office Space',
      'Open-plan loft office in a converted warehouse, ideal for creative studios and startups.',
      15000, 'month', '88 Wooster St', 'New York', 'NY', '10012',
      0, 1, 1800, 'office', 'draft'
    )
    returning id into loft_id;

  -- Placeholder rows only: real image uploads go through Cloudinary from the
  -- app, which populates cloudinary_public_id/url/width/height/format.
  insert into public.property_images (property_id, cloudinary_public_id, url, role, sort_order)
  values
    (penthouse_id, 'seed/penthouse-main', 'https://picsum.photos/seed/penthouse-main/1200/800', 'Main View', 0),
    (penthouse_id, 'seed/penthouse-kitchen', 'https://picsum.photos/seed/penthouse-kitchen/1200/800', 'Kitchen', 1),
    (penthouse_id, 'seed/penthouse-bedroom', 'https://picsum.photos/seed/penthouse-bedroom/1200/800', 'Bedroom', 2),
    (villa_id, 'seed/villa-main', 'https://picsum.photos/seed/villa-main/1200/800', 'Main View', 0),
    (villa_id, 'seed/villa-pool', 'https://picsum.photos/seed/villa-pool/1200/800', 'Pool', 1),
    (loft_id, 'seed/loft-main', 'https://picsum.photos/seed/loft-main/1200/800', 'Main View', 0);
end $$;
