-- ============================================================================
-- 7.1 Learning Projects
-- ============================================================================

-- Add project_type to projects
alter table public.projects add column project_type text default 'project' check (project_type in ('project', 'learning'));

-- Add linked_project_id to tasks to link a task in a learning project to an actual project
alter table public.tasks add column linked_project_id uuid references public.projects(id) on delete set null;
