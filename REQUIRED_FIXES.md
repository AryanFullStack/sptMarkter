# 🚨 CRITICAL FIXES REQUIRED

Your application is failing because of two missing configurations. You must fix both for "Sign Up" and "Save Address" to work.

## 1. Fix Missing Service Key (Fixes Sign Up & Profile Creation)
Your application cannot create User Profiles because the `SUPABASE_SERVICE_ROLE_KEY` is missing from your `.env` file.

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) > **Settings** > **API**.
2.  Find the `service_role` key (it is secret, starts with `ey...`).
3.  Open your local `.env` file in VS Code.
4.  Add this line:
    ```env
    SUPABASE_SERVICE_ROLE_KEY=eyJh... (paste your key here)
    ```
    *(If the line exists but is empty, paste the key there).*

## 2. Fix Database Rules (Fixes "Shop" Address Saving)
Your database is currently rejecting "Shop" and "Beauty Parlor" addresses.

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor**.
2.  Click **New Query**.
3.  Paste and Run this command:

```sql
-- 1. Allow all address types
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_address_type_check;
ALTER TABLE addresses ADD CONSTRAINT addresses_address_type_check 
  CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor'));

-- 2. (Optional but Recommended) Ensure Users can check their own profile
-- This helps debugging if Admin key fails
alter table "users" enable row level security;
create policy "Users can insert their own profile" on users
  for insert with check ( auth.uid() = id );
```

## 3. Reset Test Data
Since your previous sign-ups likely failed to create a "User Profile" (but created an "Auth User"), those accounts are broken.
- **Delete those users** from the Supabase Auth Users list.
- Sign up again **AFTER** adding the Service Key.
