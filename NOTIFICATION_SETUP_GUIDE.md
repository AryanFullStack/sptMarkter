# Notification System Setup Guide

## 📋 Overview

This guide walks you through setting up the real-time notification system for Spectrum Marketers.

## ⚡ Quick Start

### Step 1: Run Database Migration

1. Open your Supabase Dashboard project
2. Navigate to the **SQL Editor**
3. Open and run the migration file:
   ```
   database/migrations/create_notifications_table.sql
   ```
4. Verify the `notifications` table was created successfully

### Step 2: Enable Realtime (If Not Enabled)

1. In Supabase Dashboard, go to **Database** → **Replication**
2. Find the `notifications` table
3. Enable Realtime for this table

### Step 3: Verify Installation

1. Start your dev server: `npm run dev`
2. Login to your account
3. You should see a Bell icon in the top navbar
4. The system is now active!

---

## 🎯 Testing Notifications

Here are the events that trigger notifications:

| Event | Who Gets Notified |
|-------|------------------|
| User Approved | The approved user + all admins |
| User Role Updated | The affected user + all admins |
| Payment Recorded | Customer + Admin staff |
| Order Created | Customer + Admin + Assigned salesman (if any) |
| Salesman Assigned | The salesman + The shop/parlor + Admins |
| Payment Due Soon | Customer + Assigned salesman |

###Test Workflow:

1. **Login as Admin**
2. Go to pending users and approve a user
3. You should see:
   - Toast notification appear
   - Bell icon badge update
   - New notification in dropdown

4. **Login as the approved user**
5. You should see a notification: "Account Approved"

---

## 🔔 User Experience

### Notification Bell
- Located in the top navigation bar
- Shows red badge with unread count
- Updates in real-time without page refresh

### Notification Dropdown
- Click bell to open
- Shows most recent 10 notifications
- Click notification to navigate to related page
- "Mark all as read" button
- Link to full notification history

### Notification History Page
- Full list of all notifications
- Search and filter capabilities
- Pagination for many notifications
- Accessible at `/notifications`

### Toast Notifications
- Popup toast when new notification arrives
- Auto-dismisses after 5 seconds
- Click to navigate to related content

### Sound Alert
- Subtle sound plays when notification arrives
- Sound file: `public/sounds/notification.mp3`
- **Note**: You need to add your own sound file (see README in that folder)

---

## 🎨 Customization

### Adding New Notification Types

1. Add new event type to `src/types/notifications.ts`:
```typescript
export type NotificationEventType =
  | 'order_created'
  // ... existing types
  | 'your_new_event'; // Add here
```

2. Update SQL enum in `create_notifications_table.sql`:
```sql
CREATE TYPE notification_event_type AS ENUM (
  'order_created',
  -- ... existing
  'your_new_event' -- Add here
);
```

3. Add icon mapping in `src/utils/notification-helpers.ts`:
```typescript
const iconMap: Record<NotificationEventType, any> = {
  // ... existing
  your_new_event: YourIconComponent,
};
```

4. Trigger notification in your server action:
```typescript
await createNotification({
  user_id: targetUserId,
  title: "Your Title",
  message: "Your message",
  event_type: "your_new_event",
});
```

### Customizing Sound

Replace `public/sounds/notification.mp3` with your preferred sound file:
- Recommended duration: 0.5 - 1 second
- Format: MP3, WAV, or OGG
- Keep file size small (<  50KB)

### Styling

Notifications use Tailwind CSS classes. Modify these files to customize:
- `src/components/notifications/notification-bell.tsx` - Bell icon & badge
- `src/components/notifications/notification-dropdown.tsx` - Dropdown panel
- `src/components/notifications/notification-item.tsx` - Individual notification cards

---

## 🔐 Security & Privacy

- **Row Level Security (RLS)**: Users can only see their own notifications
- **Role-based filtering**: Notifications are targeted by role
- **No sensitive data**: Notifications contain user-friendly messages only
- **Realtime subscription**: Filtered by user_id on the client side

---

## 🐛 Troubleshooting

### Notifications not appearing

1. **Check database**: Verify `notifications` table exists and has data
2. **Check Realtime**: Ensure Realtime is enabled for `notifications` table
3. **Check browser console**: Look for subscription errors
4. **Check user_id**: Verify the notification's `user_id` matches the logged-in user

### Bell icon not showing

1. Verify NotificationProvider is in the layout
2. Check that user is logged in
3. Look for import errors in browser console

### Sound not playing

1. Ensure `notification.mp3` exists in `public/sounds/`
2. Check browser autoplay policy (sound requires user interaction first)
3. Check browser console for audio loading errors

### Realtime not working

1. Verify Supabase Realtime is enabled for your project
2. Check `notifications` table is published to Realtime
3. Verify no network/firewall issues blocking WebSocket connections
4. Check Supabase dashboard for Realtime connection status

---

## 📚 Additional Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Project structure in `src/components/notifications/`

---

## ✅ Next Steps

1. Run the database migration
2. Test by approving a user
3. Add more notification triggers as needed
4. Customize icons and styling to match your brand
5. Add notification sound file

**Done!** Your notification system is now ready to use! 🎉
