-- =====================================================
-- Risk Detection: Sponsor Notifications Table
-- =====================================================
-- Migration: 20260206000001_risk_detection_sponsor_notifications
-- Description: Add sponsor notifications table for risk alerts
-- Date: 2026-02-06
-- =====================================================

-- Create sponsor_notifications table
CREATE TABLE IF NOT EXISTS sponsor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('risk_alert', 'milestone', 'check_in', 'general')),
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX idx_sponsor_notifications_sponsor ON sponsor_notifications(sponsor_id, created_at DESC);
CREATE INDEX idx_sponsor_notifications_sponsee ON sponsor_notifications(sponsee_id, created_at DESC);
CREATE INDEX idx_sponsor_notifications_unread ON sponsor_notifications(sponsor_id, read_at) WHERE read_at IS NULL;

-- Row Level Security (RLS)
ALTER TABLE sponsor_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Sponsors can read their notifications
CREATE POLICY sponsor_notifications_read_own
  ON sponsor_notifications
  FOR SELECT
  USING (sponsor_id = auth.uid());

-- Policy: Sponsees can create notifications for their sponsor
CREATE POLICY sponsor_notifications_insert_for_sponsor
  ON sponsor_notifications
  FOR INSERT
  WITH CHECK (sponsee_id = auth.uid());

-- Policy: Sponsors can mark notifications as read
CREATE POLICY sponsor_notifications_update_own
  ON sponsor_notifications
  FOR UPDATE
  USING (sponsor_id = auth.uid())
  WITH CHECK (sponsor_id = auth.uid());

-- Add comment
COMMENT ON TABLE sponsor_notifications IS 'Notifications sent from sponsees to sponsors, including risk alerts';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: sponsor_notifications table created';
END $$;
