create table if not exists public.tasks (
  id bigint primary key,
  username text not null,
  text text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  completed boolean not null default false,
  due_date date null,
  created_at timestamp with time zone not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Allow anon read tasks" on public.tasks;
drop policy if exists "Allow anon insert tasks" on public.tasks;
drop policy if exists "Allow anon update tasks" on public.tasks;
drop policy if exists "Allow anon delete tasks" on public.tasks;

create policy "Allow anon read tasks"
on public.tasks
for select
to anon
using (true);

create policy "Allow anon insert tasks"
on public.tasks
for insert
to anon
with check (true);

create policy "Allow anon update tasks"
on public.tasks
for update
to anon
using (true)
with check (true);

create policy "Allow anon delete tasks"
on public.tasks
for delete
to anon
using (true);
