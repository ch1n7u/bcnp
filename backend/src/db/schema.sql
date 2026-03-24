CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'investigator', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  report_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  victim_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  crime_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  incident_datetime TIMESTAMP NOT NULL,
  suspect_details TEXT,
  financial_loss_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  location VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Investigation', 'Resolved', 'Closed')),
  assigned_investigator_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT reports_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reports_investigator_fk FOREIGN KEY (assigned_investigator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  evidence_id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  upload_time TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_notes (
  note_id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  investigator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_timeline (
  timeline_id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL,
  action_type VARCHAR(60) NOT NULL,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(30),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(120),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_crime_type ON reports(crime_type);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_investigator ON reports(assigned_investigator_id);
CREATE INDEX IF NOT EXISTS idx_evidence_report_id ON evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_report_id ON case_notes(report_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_report_id ON case_timeline(report_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_created_at ON case_timeline(created_at);

-- Enable Row Level Security for all public tables.
-- The backend uses the Supabase service role key, which can bypass RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_timeline ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_crime_distribution()
RETURNS TABLE (label text, value bigint)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT crime_type AS label, COUNT(*)::bigint AS value
  FROM reports
  GROUP BY crime_type
  ORDER BY value DESC;
$$;

CREATE OR REPLACE FUNCTION get_monthly_trend()
RETURNS TABLE (month text, reports bigint)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
         COUNT(*)::bigint AS reports
  FROM reports
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
$$;

CREATE OR REPLACE FUNCTION get_status_breakdown()
RETURNS TABLE (label text, value bigint)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT status AS label, COUNT(*)::bigint AS value
  FROM reports
  GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION get_financial_stats()
RETURNS TABLE (total_loss numeric)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(financial_loss_amount), 0)::numeric AS total_loss
  FROM reports;
$$;

CREATE OR REPLACE FUNCTION get_reports_per_state()
RETURNS TABLE (state text, reports bigint)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT location AS state, COUNT(*)::bigint AS reports
  FROM reports
  GROUP BY location
  ORDER BY reports DESC;
$$;
