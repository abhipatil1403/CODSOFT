-- Helper function to check project membership (runs as SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION check_project_membership(proj_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = proj_id
    AND email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check project admin membership (runs as SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION check_project_admin(proj_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = proj_id
    AND email = user_email
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project Members Table (Team & Roles)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  user_id UUID DEFAULT auth.uid() NOT NULL, -- Added to track who invited and manage RLS without querying projects table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, email)
);

-- Migration support for existing project_members table (run immediately after table creation check)
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_title TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'edited', 'moved', 'completed', 'deleted'
  details TEXT,
  user_email TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Policies for project_members (Bypasses recursion using helper function)
-- ----------------------------------------------------
-- View members: allowed if user belongs to the project or is project owner
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
CREATE POLICY "Users can view members of their projects"
  ON project_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    email = (auth.jwt() ->> 'email') OR
    check_project_membership(project_id, auth.jwt() ->> 'email')
  );

-- Manage members: allowed only by the creator/inviter (non-recursive)
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  USING (
    auth.uid() = user_id
  );

-- ----------------------------------------------------
-- Policies for activity_logs (Bypasses recursion using helper function)
-- ----------------------------------------------------
-- View logs: allowed if user has access to projects table
DROP POLICY IF EXISTS "Users can view logs of their projects" ON activity_logs;
CREATE POLICY "Users can view logs of their projects"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = activity_logs.project_id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON activity_logs;
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------
-- Update Projects Table Policies to support Members
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage projects they own or belong to" ON projects;
CREATE POLICY "Users can manage projects they own or belong to"
  ON projects FOR ALL
  USING (
    auth.uid() = user_id OR
    check_project_membership(id, auth.jwt() ->> 'email')
  );

-- ----------------------------------------------------
-- Update Tasks Table Policies to support Members & Roles
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage tasks in projects they have access to" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in projects they have access to" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks if owner or admin" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks if owner or admin" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in projects they have access to" ON tasks;

-- 1. SELECT tasks: Allowed for project owner or any member
CREATE POLICY "Users can view tasks in projects they have access to"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_membership(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 2. INSERT tasks: Allowed only for project owner or admin members
CREATE POLICY "Users can insert tasks if owner or admin"
  ON tasks FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_admin(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 3. DELETE tasks: Allowed only for project owner or admin members
CREATE POLICY "Users can delete tasks if owner or admin"
  ON tasks FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_admin(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 4. UPDATE tasks: Allowed for owner or members (dragging status/checking tasks)
CREATE POLICY "Users can update tasks in projects they have access to"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_membership(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- ----------------------------------------------------
-- Update Subtasks Table Policies to support Members & Roles
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can manage subtasks in tasks they have access to" ON subtasks;
DROP POLICY IF EXISTS "Users can view subtasks in tasks they have access to" ON subtasks;
DROP POLICY IF EXISTS "Users can insert subtasks if owner or admin" ON subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks if owner or admin" ON subtasks;
DROP POLICY IF EXISTS "Users can update subtasks in tasks they have access to" ON subtasks;

-- 1. SELECT subtasks: Allowed for project owner or any member
CREATE POLICY "Users can view subtasks in tasks they have access to"
  ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      WHERE tasks.id = subtasks.task_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_membership(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 2. INSERT subtasks: Allowed only for project owner or admin members
CREATE POLICY "Users can insert subtasks if owner or admin"
  ON subtasks FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      WHERE tasks.id = subtasks.task_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_admin(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 3. DELETE subtasks: Allowed only for project owner or admin members
CREATE POLICY "Users can delete subtasks if owner or admin"
  ON subtasks FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      WHERE tasks.id = subtasks.task_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_admin(projects.id, auth.jwt() ->> 'email')
      )
    )
  );

-- 4. UPDATE subtasks: Allowed for owner or members (toggling completed status)
CREATE POLICY "Users can update subtasks in tasks they have access to"
  ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      WHERE tasks.id = subtasks.task_id
      AND (
        projects.user_id = auth.uid() OR
        check_project_membership(projects.id, auth.jwt() ->> 'email')
      )
    )
  );
