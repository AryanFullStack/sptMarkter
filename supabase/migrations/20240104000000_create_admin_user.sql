-- Create admin user in auth.users
-- Note: This will create the user with the specified email
-- The password will need to be set through Supabase Auth

-- Insert into public.users table (the auth.users entry will be created via sign-up)
INSERT INTO public.users (id, email, full_name, role, credit_limit, credit_used)
SELECT 
  gen_random_uuid(),
  'aryanwaheednew@gmail.com',
  'Admin',
  'admin',
  0,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'aryanwaheednew@gmail.com'
);
