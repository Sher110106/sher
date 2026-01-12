-- Quad Platform - Schema Changes for Onboarding & Enhanced Ranking
-- Run these migrations in Supabase SQL Editor

-- ============================================
-- 1. Teacher Onboarding Tracking
-- ============================================

-- Add onboarding_completed field to teacher_profiles
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing teachers to have completed onboarding (optional)
-- Uncomment if you want existing teachers to skip onboarding
-- UPDATE teacher_profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;


-- ============================================
-- 2. Teacher Performance Metrics Table
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_metrics (
  teacher_id UUID PRIMARY KEY REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  
  -- Response time tracking
  total_requests_received INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(5,2) DEFAULT NULL,
  
  -- Success tracking
  total_accepted INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_cancelled_by_teacher INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT NULL,
  
  -- Timestamps
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_teacher_id ON teacher_metrics(teacher_id);


-- ============================================
-- 3. School-Teacher Affinity Table
-- ============================================

CREATE TABLE IF NOT EXISTS school_teacher_affinity (
  school_id UUID REFERENCES school_profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  
  sessions_completed INTEGER DEFAULT 0,
  avg_rating_from_school DECIMAL(2,1) DEFAULT NULL,
  last_session_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  PRIMARY KEY (school_id, teacher_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_affinity_school ON school_teacher_affinity(school_id);
CREATE INDEX IF NOT EXISTS idx_affinity_teacher ON school_teacher_affinity(teacher_id);


-- ============================================
-- 4. Response Time Tracking
-- ============================================

-- Add responded_at column to teaching_requests
ALTER TABLE teaching_requests
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Trigger to auto-set responded_at when status changes from pending
CREATE OR REPLACE FUNCTION update_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS set_responded_at ON teaching_requests;

CREATE TRIGGER set_responded_at
BEFORE UPDATE ON teaching_requests
FOR EACH ROW EXECUTE FUNCTION update_responded_at();


-- ============================================
-- 5. Initialize metrics for existing teachers
-- ============================================

-- Insert empty metrics records for all existing teachers
INSERT INTO teacher_metrics (teacher_id)
SELECT id FROM teacher_profiles
ON CONFLICT (teacher_id) DO NOTHING;
