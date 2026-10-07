-- ============================================================================
-- 8.1 Task Completion Tracking
-- ============================================================================

-- Add completed_at to tasks to track when a task was completed
alter table public.tasks add column completed_at timestamp with time zone;

-- Update existing completed tasks to have completed_at = updated_at or now()
update public.tasks set completed_at = coalesce(updated_at, now()) where is_completed = true;
