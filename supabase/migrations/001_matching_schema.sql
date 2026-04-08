-- Kismet Cosmic Matching Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (matchable users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  birth_day int not null,
  birth_month int not null,
  birth_year int not null,
  zodiac_sign text not null, -- e.g. 'aries', 'taurus'
  city text,
  gender text not null check (gender in ('female', 'male', 'other')),
  gender_preference text not null default 'everyone' check (gender_preference in ('female', 'male', 'everyone')),
  age_range_min int not null default 18,
  age_range_max int not null default 50,
  focus text[] default '{}',
  interests text[] default '{}',
  bio text default '' check (char_length(bio) <= 200),
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read all active profiles"
  on public.profiles for select
  using (is_active = true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- 2. WEEKLY_MATCHES
-- ============================================
create table if not exists public.weekly_matches (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  compatibility_score float not null default 0,
  compatibility_report text,
  user_a_action text not null default 'pending' check (user_a_action in ('pending', 'liked', 'passed')),
  user_b_action text not null default 'pending' check (user_b_action in ('pending', 'liked', 'passed')),
  is_mutual boolean generated always as (user_a_action = 'liked' and user_b_action = 'liked') stored,
  created_at timestamptz not null default now(),
  -- Canonical ordering: user_a < user_b
  constraint user_order check (user_a < user_b),
  -- One match per pair per week
  constraint unique_weekly_match unique (week_start, user_a, user_b)
);

-- RLS
alter table public.weekly_matches enable row level security;

create policy "Users can read own matches"
  on public.weekly_matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can update own action"
  on public.weekly_matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- ============================================
-- 3. MESSAGES (1 per user per match)
-- ============================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.weekly_matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now(),
  -- Enforce: 1 message per sender per match
  constraint one_message_per_sender unique (match_id, sender_id)
);

-- RLS
alter table public.messages enable row level security;

create policy "Match participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.weekly_matches wm
      where wm.id = match_id
        and wm.is_mutual = true
        and (auth.uid() = wm.user_a or auth.uid() = wm.user_b)
    )
  );

create policy "Match participants can send one message"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.weekly_matches wm
      where wm.id = match_id
        and wm.is_mutual = true
        and (auth.uid() = wm.user_a or auth.uid() = wm.user_b)
    )
  );

-- ============================================
-- 4. MATCH_HISTORY (prevent re-matching)
-- ============================================
create table if not exists public.match_history (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  primary key (user_a, user_b),
  constraint history_user_order check (user_a < user_b)
);

-- ============================================
-- 5. ZODIAC COMPATIBILITY FUNCTION
-- ============================================
create or replace function calculate_zodiac_compatibility(sign_a text, sign_b text)
returns float as $$
declare
  element_a text;
  element_b text;
  score float;
begin
  -- Map signs to elements
  element_a := case sign_a
    when 'aries' then 'fire' when 'leo' then 'fire' when 'sagittarius' then 'fire'
    when 'taurus' then 'earth' when 'virgo' then 'earth' when 'capricorn' then 'earth'
    when 'gemini' then 'air' when 'libra' then 'air' when 'aquarius' then 'air'
    when 'cancer' then 'water' when 'scorpio' then 'water' when 'pisces' then 'water'
    else 'unknown'
  end;

  element_b := case sign_b
    when 'aries' then 'fire' when 'leo' then 'fire' when 'sagittarius' then 'fire'
    when 'taurus' then 'earth' when 'virgo' then 'earth' when 'capricorn' then 'earth'
    when 'gemini' then 'air' when 'libra' then 'air' when 'aquarius' then 'air'
    when 'cancer' then 'water' when 'scorpio' then 'water' when 'pisces' then 'water'
    else 'unknown'
  end;

  -- Same sign
  if sign_a = sign_b then
    return 0.75;
  end if;

  -- Same element (e.g. fire+fire)
  if element_a = element_b then
    return 0.90;
  end if;

  -- Complementary elements (fire+air, earth+water)
  if (element_a = 'fire' and element_b = 'air') or (element_a = 'air' and element_b = 'fire') or
     (element_a = 'earth' and element_b = 'water') or (element_a = 'water' and element_b = 'earth') then
    return 0.80;
  end if;

  -- Classic polarity pairs (opposite signs)
  if (sign_a = 'aries' and sign_b = 'libra') or (sign_a = 'libra' and sign_b = 'aries') or
     (sign_a = 'taurus' and sign_b = 'scorpio') or (sign_a = 'scorpio' and sign_b = 'taurus') or
     (sign_a = 'gemini' and sign_b = 'sagittarius') or (sign_a = 'sagittarius' and sign_b = 'gemini') or
     (sign_a = 'cancer' and sign_b = 'capricorn') or (sign_a = 'capricorn' and sign_b = 'cancer') or
     (sign_a = 'leo' and sign_b = 'aquarius') or (sign_a = 'aquarius' and sign_b = 'leo') or
     (sign_a = 'virgo' and sign_b = 'pisces') or (sign_a = 'pisces' and sign_b = 'virgo') then
    return 0.70;
  end if;

  -- Challenging (fire+water, earth+air)
  if (element_a = 'fire' and element_b = 'water') or (element_a = 'water' and element_b = 'fire') or
     (element_a = 'earth' and element_b = 'air') or (element_a = 'air' and element_b = 'earth') then
    return 0.55;
  end if;

  -- Default
  return 0.65;
end;
$$ language plpgsql immutable;

-- ============================================
-- 6. INDEXES
-- ============================================
create index if not exists idx_profiles_active on public.profiles(is_active) where is_active = true;
create index if not exists idx_profiles_gender on public.profiles(gender);
create index if not exists idx_profiles_zodiac on public.profiles(zodiac_sign);
create index if not exists idx_weekly_matches_week on public.weekly_matches(week_start);
create index if not exists idx_weekly_matches_users on public.weekly_matches(user_a, user_b);
