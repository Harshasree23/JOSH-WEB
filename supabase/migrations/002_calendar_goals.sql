-- ============================================================================
-- 002_calendar_goals.sql
-- Calendar goals for Month view (multi-day) and Year view (monthly spans).
-- Kept separate from board_events because the data shape is different:
--   board_events  → single date + pixel time-range (day timeline)
--   calendar_goals → date RANGE + optional reminder (no pixel coords)
-- ============================================================================

create table public.calendar_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,

  -- Date range (inclusive). start_date = end_date for single-day goals.
  start_date    date not null,
  end_date      date not null,

  -- 'multi_day'  → set by dragging across days in Month view
  -- 'monthly'    → set by dragging across months in Year view
  goal_type     text not null check (goal_type in ('multi_day', 'monthly')),

  name          text not null,
  description   text,
  color         text not null default '#475569',

  has_reminder  boolean not null default false,
  reminder_date date,

  created_at    timestamptz default now(),

  -- reminder_date must fall within the goal range when set
  constraint reminder_in_range check (
    not has_reminder
    or (reminder_date is not null
        and reminder_date >= start_date
        and reminder_date <= end_date)
  ),

  -- end must be >= start
  constraint valid_range check (end_date >= start_date)
);

alter table public.calendar_goals enable row level security;

create policy "own calendar goals"
  on public.calendar_goals
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast range queries (fetch goals overlapping a given month/year)
create index calendar_goals_user_range_idx
  on public.calendar_goals (user_id, start_date, end_date);
