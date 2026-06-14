-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4f46e5',
  user_id UUID DEFAULT auth.uid() NOT NULL, -- Associate with auth user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  assignee TEXT,
  column_id TEXT NOT NULL DEFAULT 'todo',
  user_id UUID DEFAULT auth.uid() NOT NULL, -- Associate with auth user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subtasks Table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL, -- Associate with auth user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Migration checks: Add user_id column if tables already exist without it
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- Backfill existing rows to avoid NOT NULL violations (default to first auth user or NULL)
-- Set column to NOT NULL after backfilling (optional, but recommended for security)
-- ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE subtasks ALTER COLUMN user_id SET NOT NULL;

-- Create Security Policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" 
  ON projects FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" 
  ON tasks FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own subtasks" ON subtasks;
CREATE POLICY "Users can manage their own subtasks" 
  ON subtasks FOR ALL 
  USING (auth.uid() = user_id);


