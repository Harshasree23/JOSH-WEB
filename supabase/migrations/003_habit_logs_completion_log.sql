-- Migration 003: Add completion_log text column to habit_logs
-- completion_log stores a short reflection/note written after completing a habit.

alter table public.habit_logs
  add column if not exists completion_log text;
