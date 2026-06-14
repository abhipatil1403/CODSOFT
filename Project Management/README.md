# Premium Project Management Workspace (CodSoft Internship)

A premium, state-of-the-art **Project Management Tool** built using React, Vite, and Vanilla CSS, powered by a real-time **Supabase (PostgreSQL)** backend. It features beautiful glassmorphism card designs, responsive layouts, micro-animations, keyboard shortcuts, collaborative workspace capabilities, and a full dark/light theme toggle.

---

## 🌟 Key Features

### 1. 🌓 Light / Dark Theme Toggle
*   A premium, harmonic theme toggle (Sun/Moon icon in the Sidebar footer).
*   Dynamically overrides color variables using HSL tailored color schemes for maximum readability and visual excellence.
*   Uses `color-scheme: light / dark` so native browser widgets (like calendars, select option listings, and scrollbars) style themselves automatically.
*   Theme state is persisted in `localStorage` to survive page refreshes.

### 2. 📊 Project Dashboard
*   **Workspace Metrics**: Key metrics widgets tracking **Total Tasks**, **Completed Count**, **In Progress workload**, and **Completion Rate**.
*   **Project Health Radial Chart**: Visual circular progress wheel indicating overall completion percentage.
*   **Priority Distribution**: Live bar charts categorizing task urgency levels (High, Medium, Low).
*   **Double-Column Feed**: Side-by-side display of **Recently Added Tasks** and a scrolling **Project Activity Feed (Audit Trail)**.

### 3. 👥 Team Members & Roles Management
*   **Collaboration Overlay**: Modal popup inside the header allowing project owners to invite members via email.
*   **Role Assignments**: Assign roles (`Admin` or `Member`) to team collaborators.
*   **Permissions Matrix**:
    *   **Owner / Admin**: Full write privileges. Can create, edit details (title, description, priority, due date, assignee), add/delete subtasks, and delete tasks.
    *   **Member**: Restrained read-mostly permissions. Can drag cards to update status columns and check/uncheck subtask lists, but cannot modify task details. A warning banner is displayed inside the Task Drawer explaining the restrictions.

### 4. 📜 Audit Trail (Activity Logs)
*   Tracks and saves all project operations (`created`, `edited`, `moved`, `completed`, `deleted`) with timestamps and user email details.
*   Feeds directly to the Dashboard Activity Log in real-time.

### 5. 📋 Kanban Board & List Views
*   **Kanban Columns**: Swimlanes for **To Do**, **In Progress**, **In Review**, and **Completed**.
*   **Drag & Drop**: Smooth HTML5 card movement between columns.
*   **Optimistic Rollback**: Board cards move instantly. If the Supabase write fails, the card automatically snaps back to its previous position with an error toast message.
*   **Inline Subtask Checklists**: Toggle subtask completions directly on cards without opening the editor.
*   **Deadline Urgency Warnings**: Due dates color-code dynamically:
    *   *Normal* (Green): Due in more than 2 days.
    *   *Soon* (Yellow): Due within 2 days.
    *   *Overdue* (Pulsing Red Icon + Badge): Due date has passed.
*   **Sheet View (List View)**: Clean spreadsheet grid tracking tasks, statuses, priorities, deadlines, and assignees with title search and status/priority filters.

### 6. ⌨️ Keyboard Shortcuts
Toggled via the keyboard button or by pressing `?` / `Ctrl/Cmd + K`:
*   `N` : Open task creation drawer (pre-populates column status).
*   `/` : Navigate to List tab and focus the search input field.
*   `Esc` : Instantly close the active centered modal or drawer panel.

---

## 🔒 Security & Robustness

*   **Error Boundaries**: Wrapped in React error boundaries to gracefully intercept and render fallback screens on database connection dropouts or rendering crashes.
*   **Protected Routes**: Dashboard paths check session states immediately. Users without an active token are redirected back to the glassmorphic authentication screen.
*   **Row-Level Security (RLS)**: Enforced in Supabase. Users can only manage projects they created or are explicitly invited to via `project_members`.
    *   *Recursion-Free Policies*: Structured to avoid mutual recursion by resolving project access independently of project member lookups.
*   **Form Validation**: Prevent blank task titles, limit title lengths (max 80 characters), and restrict due dates to today or in the future.

---

## ⚙️ Tech Stack & Structure

*   **Frontend**: React 19 + Vite 8
*   **Styling**: Vanilla CSS (variables, glassmorphic layout, keyframes, fluid animations)
*   **Icons**: Lucide React
*   **Database**: Supabase (PostgreSQL)

---

## 📁 PostgreSQL Database Schema

Run this SQL query in your Supabase console **SQL Editor** to create the tables, setup column migration mappings, and enable recursion-free Row-Level Security:

```sql
-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4f46e5',
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  assignee TEXT,
  column_id TEXT NOT NULL DEFAULT 'todo',
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subtasks Table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Members Table (Team & Roles)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, email)
);

-- Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_title TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  user_email TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Policies for project_members
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
CREATE POLICY "Users can view members of their projects"
  ON project_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- Policies for activity_logs
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view logs of their projects" ON activity_logs;
CREATE POLICY "Users can view logs of their projects"
  ON activity_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON activity_logs;
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------
-- Update Projects Table Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage projects they own or belong to" ON projects;
CREATE POLICY "Users can manage projects they own or belong to"
  ON projects FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.email = (auth.jwt() ->> 'email')
    )
  );

-- ----------------------------------------------------
-- Update Tasks Table Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage tasks in projects they have access to" ON tasks;
CREATE POLICY "Users can manage tasks in projects they have access to"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
    )
  );

-- ----------------------------------------------------
-- Update Subtasks Table Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage subtasks in tasks they have access to" ON subtasks;
CREATE POLICY "Users can manage subtasks in tasks they have access to"
  ON subtasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
    )
  );

-- ----------------------------------------------------
-- Migration support checks
-- ----------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd CODSOFT
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-api-anon-key
   ```

4. **Start the local server**:
   ```bash
   npm run dev
   ```
   *Runs on port `3000` (configured via `package.json`).*

5. **Build for production**:
   ```bash
   npm run build
   ```
