# ⚠️ CRITICAL DATABASE UPDATE REQUIRED

The "Save Address" feature is failing because your database handles 'home' and 'office' addresses, but rejects 'shop' and 'beauty_parlor' addresses.

**This is why you see the error when trying to save.**

## 🛠️ HOW TO FIX IT (Required)

You must run this SQL command in your Supabase Dashboard to allow the new address types.

1.  **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  Select your project **sptMarkter**.
3.  Click the **SQL Editor** icon in the left sidebar.
4.  Click **New Query**.
5.  **Copy and Paste** the following code exactly:

```sql
-- Remove the old restriction
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_address_type_check;

-- Add the new rule giving permission for all address types
ALTER TABLE addresses 
  ADD CONSTRAINT addresses_address_type_check 
  CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor'));
```

6.  Click **Run**.

After you do this, the "Save Address" button will work correctly on all forms.
