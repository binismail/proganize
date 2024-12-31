-- Create PDF extracted content table
create table pdf_extracted_content (
  id uuid default uuid_generate_v4() primary key,
  pdf_conversation_id uuid references pdf_conversations(id) on delete cascade,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Add RLS policies
alter table pdf_extracted_content enable row level security;

create policy "Users can view their own pdf content"
  on pdf_extracted_content for select
  using (auth.uid() = user_id);

create policy "Users can insert their own pdf content"
  on pdf_extracted_content for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pdf content"
  on pdf_extracted_content for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own pdf content"
  on pdf_extracted_content for delete
  using (auth.uid() = user_id);
