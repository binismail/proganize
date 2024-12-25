-- Create study_materials table
create table if not exists public.study_materials (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    content jsonb not null,
    type text not null check (type in ('flashcards', 'quiz')),
    source_type text not null check (source_type in ('document', 'pdf')),
    source_id uuid not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.study_materials enable row level security;

create policy "Users can view their own study materials"
    on public.study_materials for select
    using (auth.uid() = user_id);

create policy "Users can insert their own study materials"
    on public.study_materials for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own study materials"
    on public.study_materials for update
    using (auth.uid() = user_id);

create policy "Users can delete their own study materials"
    on public.study_materials for delete
    using (auth.uid() = user_id);

-- Create indexes
create index study_materials_user_id_idx on public.study_materials(user_id);
create index study_materials_source_idx on public.study_materials(source_type, source_id);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_study_materials_updated_at
    before update on public.study_materials
    for each row
    execute procedure public.handle_updated_at();
