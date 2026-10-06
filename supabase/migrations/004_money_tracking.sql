-- ============================================================================
-- Money Tracking
-- ============================================================================

-- Wallets — tracks starting balance per user (one per user for now)
create table public.money_wallets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null unique,
  name         text not null default 'My Wallet',
  balance      numeric not null default 0,
  currency     text not null default 'INR',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.money_wallets enable row level security;
create policy "own wallet" on public.money_wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expense Groups — named collections of transactions (e.g. "Goa Trip")
create table public.expense_groups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  name         text not null,
  description  text,
  color        text default '#374151',
  icon         text default '📁',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.expense_groups enable row level security;
create policy "own expense groups" on public.expense_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expense Transactions
-- tx_type: 'expense' (money out) | 'credit' (money added/top-up)
create table public.expense_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  group_id     uuid references public.expense_groups(id) on delete set null,
  tx_type      text not null default 'expense' check (tx_type in ('expense', 'credit')),
  category     text not null,
  description  text not null,
  what_i_got   text,
  amount       numeric not null check (amount > 0),
  tx_date      date not null default current_date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.expense_transactions enable row level security;
create policy "own transactions" on public.expense_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes for fast queries
create index idx_expense_tx_user_date on public.expense_transactions(user_id, tx_date desc);
create index idx_expense_tx_group     on public.expense_transactions(group_id);
