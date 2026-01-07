-- Create countries table
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  safety_level integer not null default 3 check (safety_level between 1 and 5),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.countries enable row level security;

-- Everyone can read countries
create policy "countries_select_all"
  on public.countries for select
  to authenticated
  using (true);

-- Only admins can modify countries
create policy "countries_admin_all"
  on public.countries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create safety alerts table
create table if not exists public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.safety_alerts enable row level security;

-- Everyone can read active alerts
create policy "safety_alerts_select_active"
  on public.safety_alerts for select
  to authenticated
  using (is_active = true);

-- Only admins can modify alerts
create policy "safety_alerts_admin_all"
  on public.safety_alerts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create travel tips table
create table if not exists public.travel_tips (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('general', 'health', 'safety', 'culture', 'transportation')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.travel_tips enable row level security;

-- Everyone can read tips
create policy "travel_tips_select_all"
  on public.travel_tips for select
  to authenticated
  using (true);

-- Only admins can modify tips
create policy "travel_tips_admin_all"
  on public.travel_tips for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
