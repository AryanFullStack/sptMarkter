# 🩺 Notification System Troubleshooting Guide

If notifications are still not appearing, please follow these steps:

## 1. Verify Database Setup
The most common issue is the database table missing or incorrect RLS policies.

1. Open Supabase SQL Editor.
2. Run this query to check if table exists:
   ```sql
   SELECT * FROM public.notifications LIMIT 1;
   ```
3. **If it fails**: You MUST run the migration script in `database/migrations/create_notifications_table.sql`.

## 2. Check Realtime Status
1. Go to Supabase Dashboard.
2. Navigate to **Database** > **Replication**.
3. Verify `notifications` table has **Source** column enabled (green switch).
4. If off, toggle it ON.

## 3. Verify RLS Policies
If RLS is too strict, you won't see your own notifications.

1. Run this in SQL Editor to check policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```
2. You should see "Users can view their own notifications".
3. Check your user ID:
   ```sql
   SELECT auth.uid(); -- Run this in a policy check simulator in dashboard
   ```

## 4. Check Browser Console
1. Open Developer Tools (F12).
2. Look for "Realtime subscription status: SUBSCRIBED".
3. If you see "CHANNEL_ERROR", check your internet or Supabase connection.

## 5. Send a Test Notification
Run this in SQL Editor to manually insert a notification for your user:

```sql
-- Replace YOUR_USER_ID with your actual UUID from auth.users
INSERT INTO public.notifications (
  user_id, 
  title, 
  message, 
  event_type
) VALUES (
  'YOUR_USER_ID_HERE', 
  'Test Notification', 
  'This is a manual test.', 
  'user_approved'
);
```

## 6. Clear Browser Cache
Sometimes old cached code causes issues.
1. Hard refresh the page (`Ctrl + Shift + R`).
2. Logout and Login again to refresh the session.
