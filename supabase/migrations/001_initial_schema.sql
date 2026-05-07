-- ============================================================
-- Task Reminder & Daily Routine Management App
-- Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Profiles (extends Supabase Auth users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- User Preferences
-- ============================================================
CREATE TABLE user_preferences (
  user_id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  default_lead_time      SMALLINT NOT NULL DEFAULT 15
                           CHECK (default_lead_time IN (5, 10, 15, 30, 60)),
  theme                  TEXT NOT NULL DEFAULT 'system'
                           CHECK (theme IN ('light', 'dark', 'system')),
  biometric_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tasks
-- ============================================================
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('high', 'medium', 'low')),
  category            TEXT NOT NULL DEFAULT 'personal'
                        CHECK (category IN ('school', 'work', 'personal', 'health')),
  recurrence_type     TEXT NOT NULL DEFAULT 'none'
                        CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'selected_days')),
  recurrence_days     SMALLINT[],
  recurrence_group_id UUID,
  reminder_lead_time  SMALLINT NOT NULL DEFAULT 15
                        CHECK (reminder_lead_time IN (5, 10, 15, 30, 60)),
  is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at        TIMESTAMPTZ,
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX idx_tasks_recurrence_group ON tasks(recurrence_group_id);

-- ============================================================
-- Routines
-- ============================================================
CREATE TABLE routines (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  time_block          TEXT NOT NULL CHECK (time_block IN ('morning', 'afternoon', 'evening')),
  recurrence_type     TEXT NOT NULL DEFAULT 'daily'
                        CHECK (recurrence_type IN ('daily', 'weekly', 'selected_days')),
  recurrence_days     SMALLINT[],
  reminder_lead_time  SMALLINT NOT NULL DEFAULT 15
                        CHECK (reminder_lead_time IN (5, 10, 15, 30, 60)),
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routines_user_id ON routines(user_id);

-- ============================================================
-- Habits (items within a routine)
-- ============================================================
CREATE TABLE habits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id   UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_habits_routine_id ON habits(routine_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);

-- ============================================================
-- Task Completions (audit log for progress tracking)
-- ============================================================
CREATE TABLE task_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date         DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_task_completions_user_date ON task_completions(user_id, date);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users own their profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own their preferences"
  ON user_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their routines"
  ON routines FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their habits"
  ON habits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their completions"
  ON task_completions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Auto-create profile on user signup (via Supabase Auth trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
