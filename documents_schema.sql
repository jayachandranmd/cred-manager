-- Create documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  file_path text not null,
  file_type text not null,
  size bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.documents enable row level security;

-- Policies for documents table
create policy "Users can view their own documents"
  on public.documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
  on public.documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own documents"
  on public.documents for delete
  using ( auth.uid() = user_id );

-- STORAGE POLICIES
-- Note: You must create a bucket named 'vault' in the Supabase Dashboard first if it doesn't exist.
-- These policies assume the bucket exists.

-- Allow users to upload files to their own folder (vault/user_id/*)
create policy "Users can upload their own documents"
on storage.objects for insert
with check (
  bucket_id = 'vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
create policy "Users can view their own documents"
on storage.objects for select
using (
  bucket_id = 'vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
create policy "Users can delete their own documents"
on storage.objects for delete
using (
  bucket_id = 'vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
