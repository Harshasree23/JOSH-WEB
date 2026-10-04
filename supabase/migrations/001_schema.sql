-- ============================================================================
-- 4.1 Profiles
-- ============================================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile write" on public.profiles
  for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- 4.2 Categories (system-seeded, fixed set)
-- ============================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  icon text,
  color_hex text,
  sort_order int not null
);

alter table public.categories enable row level security;
create policy "categories are public" on public.categories
  for select using (true);

insert into public.categories (slug, display_name, icon, color_hex, sort_order) values
  ('health',        'Health',        '💪', '#10B981', 1),
  ('mind',          'Mind',          '🧠', '#8B5CF6', 2),
  ('work',          'Work',          '💼', '#F59E0B', 3),
  ('relationships', 'Relationships', '❤️', '#EC4899', 4),
  ('finance',       'Finance',       '💰', '#06B6D4', 5);

-- ============================================================================
-- 4.3 Habits
-- ============================================================================
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  name text not null,
  description text,
  is_quantifiable boolean default false,
  baseline_target numeric,
  unit text,
  frequency text default 'daily',
  is_active boolean default true,
  created_at timestamptz default now(),
  archived_at timestamptz
);

alter table public.habits enable row level security;
create policy "own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 4.4 Habit Logs
-- ============================================================================
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null,
  completed boolean not null default false,
  actual_value numeric,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);

alter table public.habit_logs enable row level security;
create policy "own logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 4.5 Habit Streaks (precomputed, maintained by trigger)
-- ============================================================================
create table public.habit_streaks (
  habit_id uuid references public.habits(id) on delete cascade primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_completed_date date
);

alter table public.habit_streaks enable row level security;
create policy "own streaks" on public.habit_streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 4.6 Journal Entries
-- ============================================================================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  entry_date date not null,
  content text,
  mood_score int check (mood_score between 1 and 5),
  created_at timestamptz default now(),
  unique (user_id, entry_date)
);

alter table public.journal_entries enable row level security;
create policy "own journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 4.7 Journal <-> Habit Link Table
-- ============================================================================
create table public.journal_habit_links (
  journal_entry_id uuid references public.journal_entries(id) on delete cascade,
  habit_log_id uuid references public.habit_logs(id) on delete cascade,
  primary key (journal_entry_id, habit_log_id)
);

alter table public.journal_habit_links enable row level security;
create policy "own journal links" on public.journal_habit_links
  for all using (
    journal_entry_id in (
      select id from public.journal_entries where user_id = auth.uid()
    )
  )
  with check (
    journal_entry_id in (
      select id from public.journal_entries where user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4.8 Groups & Membership
-- ============================================================================
-- 1. Create tables FIRST
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- 2. Apply Policies AFTER both tables exist
alter table public.groups enable row level security;
create policy "group members can read" on public.groups
  for select using (
    id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "anyone can create group" on public.groups
  for insert with check (auth.uid() = owner_id);
create policy "owner can update group" on public.groups
  for update using (auth.uid() = owner_id);

alter table public.group_members enable row level security;
create policy "members can read membership" on public.group_members
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "can join groups" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "can leave groups" on public.group_members
  for delete using (auth.uid() = user_id);

-- 3. Now apply the cross-table profile policy
create policy "group member profiles" on public.profiles
  for select using (
    id in (
      select gm2.user_id from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4.9 Precomputed Daily Scores
-- ============================================================================
create table public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  score_date date not null,
  completion_score numeric,
  streak_score numeric,
  limit_multiplier numeric,
  total_score numeric,
  unique (user_id, score_date)
);

alter table public.daily_scores enable row level security;
create policy "group-visible scores" on public.daily_scores
  for select using (
    user_id in (
      select gm2.user_id from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
    )
  );
create policy "own scores" on public.daily_scores
  for select using (auth.uid() = user_id);

-- ============================================================================
-- 4.10 Board Events (daily activity / time-block scheduler)
-- ============================================================================
create table public.board_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_date date not null,
  name text not null,
  description text,
  start_px int not null,         
  end_px int not null,           
  color text default '#4B5563',  
  created_at timestamptz default now()
);

alter table public.board_events enable row level security;
create policy "own board events" on public.board_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: Maintain habit_streaks on habit_log changes
-- ============================================================================
create or replace function public.update_habit_streak()
returns trigger as $$
declare
  v_prev_date date;
  v_streak int;
  v_longest int;
begin
  if NEW.completed = false then
    select last_completed_date, current_streak, longest_streak
    into v_prev_date, v_streak, v_longest
    from public.habit_streaks
    where habit_id = NEW.habit_id;

    if v_prev_date = NEW.log_date then
      with consecutive_dates as (
        select log_date,
               log_date - (row_number() over (order by log_date desc))::int as grp
        from public.habit_logs
        where habit_id = NEW.habit_id
          and completed = true
          and log_date < NEW.log_date
        order by log_date desc
      )
      select count(*), max(log_date)
      into v_streak, v_prev_date
      from consecutive_dates
      where grp = (select grp from consecutive_dates limit 1);

      update public.habit_streaks
      set current_streak = coalesce(v_streak, 0),
          last_completed_date = v_prev_date
      where habit_id = NEW.habit_id;
    end if;
    return NEW;
  end if;

  select last_completed_date, current_streak, longest_streak
  into v_prev_date, v_streak, v_longest
  from public.habit_streaks
  where habit_id = NEW.habit_id;

  if not found then
    insert into public.habit_streaks (habit_id, user_id, current_streak, longest_streak, last_completed_date)
    values (NEW.habit_id, NEW.user_id, 1, 1, NEW.log_date);
    return NEW;
  end if;

  if NEW.log_date = v_prev_date then
    return NEW;
  elsif NEW.log_date = v_prev_date + 1 then
    v_streak := v_streak + 1;
  elsif NEW.log_date > coalesce(v_prev_date, '1970-01-01'::date) then
    v_streak := 1;
  else
    return NEW;
  end if;

  if v_streak > v_longest then
    v_longest := v_streak;
  end if;

  update public.habit_streaks
  set current_streak = v_streak,
      longest_streak = v_longest,
      last_completed_date = NEW.log_date
  where habit_id = NEW.habit_id;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_streak
  after insert or update on public.habit_logs
  for each row execute function public.update_habit_streak();

-- ============================================================================
-- TRIGGER: Category Coverage Enforcement
-- ============================================================================
create or replace function public.enforce_category_coverage()
returns trigger as $$
declare
  v_active_count int;
begin
  if TG_OP = 'UPDATE' then
    if OLD.is_active = true and NEW.is_active = false then
      select count(*) into v_active_count
      from public.habits
      where user_id = OLD.user_id
        and category_id = OLD.category_id
        and is_active = true
        and id != OLD.id;

      if v_active_count = 0 then
        raise exception 'Cannot deactivate the last active habit in category. Add a replacement habit first.';
      end if;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.is_active = true then
      select count(*) into v_active_count
      from public.habits
      where user_id = OLD.user_id
        and category_id = OLD.category_id
        and is_active = true
        and id != OLD.id;

      if v_active_count = 0 then
        raise exception 'Cannot delete the last active habit in category. Add a replacement habit first.';
      end if;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_category_coverage
  before update or delete on public.habits
  for each row execute function public.enforce_category_coverage();

-- ============================================================================
-- FUNCTION: compute_daily_score
-- ============================================================================
create or replace function public.compute_daily_score(p_user_id uuid, p_date date)
returns void as $$
declare
  v_total_active int;
  v_completed int;
  v_completion_rate numeric;
  v_completion_score numeric;
  v_avg_streak numeric;
  v_streak_score numeric;
  v_avg_overage numeric;
  v_limit_multiplier numeric;
  v_base numeric;
  v_total numeric;
begin
  select count(*) into v_total_active
  from public.habits
  where user_id = p_user_id and is_active = true;

  if v_total_active = 0 then
    return;
  end if;

  select count(*) into v_completed
  from public.habit_logs
  where user_id = p_user_id
    and log_date = p_date
    and completed = true;

  v_completion_rate := v_completed::numeric / v_total_active::numeric;
  v_completion_score := v_completion_rate * 100;

  select coalesce(avg(
    least(sqrt(greatest(hs.current_streak, 0)) * 10, 100)
  ), 0)
  into v_streak_score
  from public.habit_streaks hs
  join public.habits h on h.id = hs.habit_id
  where hs.user_id = p_user_id
    and h.is_active = true;

  select coalesce(avg(
    greatest(0, (hl.actual_value - h.baseline_target) / nullif(h.baseline_target, 0))
  ), 0)
  into v_avg_overage
  from public.habit_logs hl
  join public.habits h on h.id = hl.habit_id
  where hl.user_id = p_user_id
    and hl.log_date = p_date
    and hl.completed = true
    and h.is_quantifiable = true
    and h.baseline_target is not null
    and h.baseline_target > 0;

  if v_avg_overage is null or not exists (
    select 1 from public.habits
    where user_id = p_user_id and is_active = true and is_quantifiable = true
  ) then
    v_limit_multiplier := 1;
  else
    v_limit_multiplier := 1 + least(v_avg_overage, 0.5);
  end if;

  v_base := (v_completion_score * 0.6) + (v_streak_score * 0.4);
  v_total := v_base * v_limit_multiplier;

  insert into public.daily_scores (user_id, score_date, completion_score, streak_score, limit_multiplier, total_score)
  values (p_user_id, p_date, v_completion_score, v_streak_score, v_limit_multiplier, v_total)
  on conflict (user_id, score_date) do update set
    completion_score = excluded.completion_score,
    streak_score = excluded.streak_score,
    limit_multiplier = excluded.limit_multiplier,
    total_score = excluded.total_score;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- FUNCTION: Auto-create profile on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();