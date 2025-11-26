-- Create profiles table to store secondary password hash
create table public.profiles (
  id uuid references auth.users not null primary key,
  secondary_password_hash text
);

-- Create credentials table
create table public.credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  platform text not null,
  username text not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.credentials enable row level security;

-- Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Policies for credentials
create policy "Users can view their own credentials"
  on public.credentials for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own credentials"
  on public.credentials for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own credentials"
  on public.credentials for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own credentials"
  on public.credentials for delete
  using ( auth.uid() = user_id );
