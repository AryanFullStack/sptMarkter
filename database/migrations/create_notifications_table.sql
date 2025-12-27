-- =============================================
-- NOTIFICATIONS TABLE MIGRATION
-- Real-time notification system for Spectrum Marketers
-- =============================================

-- Step 1: Drop existing table if it exists (clean slate for migration)
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Step 2: Drop existing enum if it exists
DROP TYPE IF EXISTS notification_event_type CASCADE;

-- Step 3: Create event_type enum
CREATE TYPE notification_event_type AS ENUM (
  'order_created',
  'order_status_updated',
  'payment_received',
  'payment_updated',
  'payment_due_soon',
  'payment_overdue',
  'pending_limit_exceeded',
  'pending_limit_warning',
  'salesman_assigned',
  'salesman_unassigned',
  'user_registered',
  'user_approved',
  'user_role_updated',
  'user_suspended',
  'deal_applied',
  'discount_applied',
  'stock_low',
  'stock_out'
);

-- Step 4: Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target user
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role-based filtering (allows targeting by role)
  role VARCHAR(50), -- Can be null for user-specific notifications
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  event_type notification_event_type NOT NULL,
  
  -- Related entities (for navigation)
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  data JSONB, -- Additional event-specific data
  
  -- Read tracking
  read_status BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for efficient querying
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_role ON public.notifications(role);
CREATE INDEX idx_notifications_read_status ON public.notifications(read_status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_status) WHERE read_status = false;
CREATE INDEX idx_notifications_event_type ON public.notifications(event_type);
CREATE INDEX idx_notifications_related_order ON public.notifications(related_order_id) WHERE related_order_id IS NOT NULL;

-- Step 6: Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies
-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own old notifications (optional, for cleanup)
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 8: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for updated_at
CREATE TRIGGER notifications_updated_at_trigger
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Step 10: Create function to auto-set read_at when read_status changes to true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_status = true AND OLD.read_status = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger for read_at
CREATE TRIGGER notifications_read_at_trigger
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_at();

-- Step 12: Enable Realtime for instant notifications
-- Note: This might fail if the table is not yet published to realtime
-- If it fails, enable it manually in Supabase Dashboard > Database > Replication
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN 
    RAISE NOTICE 'Realtime publication not configured. Please enable Realtime for notifications table in Supabase Dashboard.';
END $$;

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================
-- 
-- Next Steps:
-- 1. Verify the table was created: SELECT * FROM public.notifications LIMIT 1;
-- 2. Check Realtime is enabled in Supabase Dashboard:
--    - Go to Database > Replication
--    - Find 'notifications' table
--    - Toggle Realtime ON if not already enabled
-- 3. Test by inserting a sample notification
-- 
-- =============================================
