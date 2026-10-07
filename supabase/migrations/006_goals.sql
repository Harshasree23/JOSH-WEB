-- ============================================================================
-- 6.1 Goals
-- ============================================================================
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  target_value numeric,
  target_unit text,
  time_period_start date,
  time_period_end date,
  frequency text default 'daily', -- daily, weekly, biweekly, custom
  status text default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.goals enable row level security;
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6.2 Goal <-> Habits Link
-- ============================================================================
create table public.goal_habits (
  goal_id uuid references public.goals(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  primary key (goal_id, habit_id)
);

alter table public.goal_habits enable row level security;
create policy "own goal habits" on public.goal_habits
  for all using (
    goal_id in (select id from public.goals where user_id = auth.uid())
  )
  with check (
    goal_id in (select id from public.goals where user_id = auth.uid())
  );

-- ============================================================================
-- 6.3 Goal <-> Projects Link
-- ============================================================================
create table public.goal_projects (
  goal_id uuid references public.goals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  primary key (goal_id, project_id)
);

alter table public.goal_projects enable row level security;
create policy "own goal projects" on public.goal_projects
  for all using (
    goal_id in (select id from public.goals where user_id = auth.uid())
  )
  with check (
    goal_id in (select id from public.goals where user_id = auth.uid())
  );

-- ============================================================================
-- 6.4 Standalone Goal Tasks (Modifying Tasks Table)
-- ============================================================================
alter table public.tasks alter column project_id drop not null;
alter table public.tasks add column goal_id uuid references public.goals(id) on delete cascade;
