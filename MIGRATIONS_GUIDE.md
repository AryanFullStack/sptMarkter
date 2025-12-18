# Running Database Migrations for Spectrum Marketers

## Quick Start - Apply Migrations to Supabase

You have 3 migration files that need to be executed in your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. **Go to your Supabase Dashboard**:
   - Open https://app.supabase.com
   - Select your project: `erdefynfsnbkgrtpyqyj`

2. **Navigate to SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run migrations in order**:

   **Step 1** - Run first migration:
   - Copy the entire content from: `supabase/migrations/20251217100000_remove_credits_add_pending_limit.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for success message

   **Step 2** - Run second migration:
   - Copy the entire content from: `supabase/migrations/20251217120000_salesman_system.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

   **Step 3** - Run third migration:
   - Copy the entire content from: `supabase/migrations/20251217120001_payment_enhancements.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

4. **Verify**:
   - Go to "Table Editor" in Supabase Dashboard
   - You should see new tables: `salesman_brands`, `salesman_activity_logs`
   - Check `users` table has new column: `assigned_salesman_id`
   - Check `orders` table has: `recorded_by`, `created_via`, `deals_applied`
   - Check `payments` table has: `payment_sequence`, `remaining_balance`, etc.

---

### Option 2: Using Supabase CLI (If you have it installed)

```bash
# In your terminal, run:
npx supabase db push

# This will apply all pending migrations
```

---

### Option 3: Manual SQL Execution (Alternative)

If you prefer to run SQL directly:

1. Open your database tool (pgAdmin, TablePlus, etc.)
2. Connect to your Supabase database
3. Run each migration file in order (same order as Option 1)

---

## After Running Migrations

1. **Restart your dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Test the Admin Dashboard**:
   - Go to http://localhost:3000/admin
   - Click on "Salesmen" tab
   - Try creating a salesman
   - Assign brands to the salesman

3. **Everything should work!** ✅

---

## Migration Files Location

All migration files are in: `d:\smartmarketer\sptMarkter\supabase\migrations\`

1. `20251217100000_remove_credits_add_pending_limit.sql` (First)
2. `20251217120000_salesman_system.sql` (Second)
3. `20251217120001_payment_enhancements.sql` (Third)

**IMPORTANT**: Run them in this exact order!

---

## Troubleshooting

**If you get errors:**
- Make sure you're connected to the correct database
- Check that you're running as a superuser/admin
- Verify the migrations run in the correct order
- Check for any existing conflicting table names

**Still having issues?**
Let me know the specific error message and I'll help debug!
