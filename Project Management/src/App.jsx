import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import TaskDrawer from './components/TaskDrawer';
import Auth from './components/Auth';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './supabaseClient';
import { Plus, Keyboard, Users, X, Bell } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'in-review', title: 'In Review' },
  { id: 'done', title: 'Completed' }
];

const PRESET_COLORS = [
  '#4f46e5', '#a855f7', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#14b8a6', '#ec4899', '#f97316', '#64748b', '#84cc16', '#06b6d4'
];

export default function App() {
  const [session, setSession] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('codsoft_pm_theme') || 'dark');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [bgSyncing, setBgSyncing] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
    localStorage.setItem('codsoft_pm_theme', theme);
  }, [theme]);

  // Click outside notifications to close
  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notification-btn-container')) {
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isNotificationsOpen]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Modal / Drawer controls
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState('todo');

  // Keyboard shortcut legend overlay
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);

  const addToast = (message, type = 'info') => {
    setToasts((prev) => [...prev, { id: Date.now().toString() + Math.random().toString(), message, type }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  // Verify auth session
  useEffect(() => {
    let isMounted = true;

    // Load session immediately on mount
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (!isMounted) return;
      setSession(activeSession);
      if (activeSession) {
        fetchInitialData(true); // Full screen loader ONLY on first mount
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, activeSession) => {
      if (!isMounted) return;
      
      // Update session if it changed
      setSession(activeSession);
      
      if (activeSession) {
        // Skip calling fetchInitialData if we are already logged in and it's just a focus token refresh event
        if (event === 'SIGNED_IN') {
          fetchInitialData(false);
        } else if (event === 'SIGNED_OUT') {
          setProjects([]);
          setTasks([]);
          setLoading(false);
        }
      } else {
        setProjects([]);
        setTasks([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Set up Supabase Realtime channel subscription for instant collaborative sync
  useEffect(() => {
    if (!session) return;

    const channel = supabase.channel('realtime_pm_workspace')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchInitialData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchInitialData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, () => {
        fetchInitialData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, () => {
        fetchInitialData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchInitialData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Keyboard shortcut hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!session) return;
      
      // Ignore when typing inside input/textarea fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (activeProjectId) {
          handleOpenTaskDrawer(null, 'todo');
        } else {
          addToast('Please create a project first.', 'error');
        }
      } else if (e.key === '/') {
        e.preventDefault();
        setCurrentTab('list');
        // Let component focus inputs next render tick
        setTimeout(() => {
          const searchInput = document.querySelector('.search-bar-wrapper input');
          if (searchInput) searchInput.focus();
        }, 50);
      } else if (e.key === '?' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setShowShortcutsLegend(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, activeProjectId]);

  const fetchInitialData = async (showGlobalLoader = false) => {
    try {
      if (showGlobalLoader) {
        setLoading(true);
      } else {
        setBgSyncing(true);
      }
      
      // 1. Fetch projects
      const { data: dbProjects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projError) throw projError;

      setProjects(dbProjects || []);

      if (dbProjects && dbProjects.length > 0) {
        const storedActive = localStorage.getItem('codsoft_pm_active_project');
        const activeExists = dbProjects.some(p => p.id === storedActive);
        setActiveProjectId(activeExists ? storedActive : dbProjects[0].id);
      }

      // 2. Fetch tasks and their nested subtasks
      const { data: dbTasks, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks (*)
        `)
        .order('created_at', { ascending: false });

      if (taskError) throw taskError;

      const formattedTasks = (dbTasks || []).map(t => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.due_date,
        assignee: t.assignee,
        columnId: t.column_id,
        createdAt: t.created_at,
        subtasks: (t.subtasks || []).map(s => ({
          id: s.id,
          title: s.title,
          completed: s.completed
        }))
      }));

      setTasks(formattedTasks);

      // 3. Fetch project members (optional check in case tables not run yet)
      try {
        const { data: dbMembers, error: memError } = await supabase
          .from('project_members')
          .select('*');
        if (memError) throw memError;
        setProjectMembers(dbMembers || []);
      } catch (err) {
        console.warn('project_members table not initialized yet:', err.message);
      }

      // 4. Fetch activity logs (optional check)
      try {
        const { data: dbLogs, error: logError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40);
        if (logError) throw logError;
        setActivityLogs(dbLogs || []);
      } catch (err) {
        console.warn('activity_logs table not initialized yet:', err.message);
      }

    } catch (err) {
      console.error('Error fetching data from Supabase:', err.message);
      addToast(`Sync error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setBgSyncing(false);
    }
  };

  // Keep track of active project in local storage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('codsoft_pm_active_project', activeProjectId);
    }
  }, [activeProjectId]);

  // Project managers
  const handleAddProject = async (name) => {
    // Select one of the preset colors randomly
    const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, color }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects([...projects, data]);
        setActiveProjectId(data.id);
        setCurrentTab('board'); // Auto-navigate to Kanban Board directly
        addToast(`Project "${name}" created!`, 'success');
        handleLogActivity(data.id, name, 'created', `Project "${name}" was created.`);
      }
    } catch (err) {
      console.error('Error creating project:', err.message);
      addToast(`Failed to create project: ${err.message}`, 'error');
    }
  };

  const executeDeleteProject = async (projectId, name) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      addToast(`Project "${name}" deleted successfully.`, 'success');
      
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      if (activeProjectId === projectId) {
        setActiveProjectId(updatedProjects.length > 0 ? updatedProjects[0].id : '');
      }
      
      setTasks(tasks.filter(t => t.projectId !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err.message);
      addToast(`Failed to delete project: ${err.message}`, 'error');
    }
  };

  const handleDeleteProject = (projectId, name) => {
    setDeleteConfirmation({ type: 'project', id: projectId, name });
  };

  const handleUpdateProjectColor = async (projectId, color) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ color })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.map(p => p.id === projectId ? { ...p, color } : p));
      addToast('Project color updated successfully.', 'success');
      handleLogActivity(projectId, 'Project Color', 'edited', `Updated project color.`);
    } catch (err) {
      console.error('Error updating project color:', err.message);
      addToast(`Failed to update color: ${err.message}`, 'error');
    }
  };

  const handleInviteMember = async (projectId, email, role) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .insert([{ project_id: projectId, email, role }]);
      if (error) throw error;
      addToast(`Member ${email} invited as ${role}!`, 'success');
      await fetchInitialData(false);
    } catch (err) {
      console.error('Error inviting member:', err.message);
      addToast(`Failed to invite member: ${err.message}`, 'error');
    }
  };

  const handleLogActivity = async (projectId, taskTitle, action, details) => {
    try {
      if (!session) return;
      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          project_id: projectId,
          task_title: taskTitle,
          action,
          details,
          user_email: session.user.email
        }]);
      if (error) console.error('Failed to write log:', error.message);
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  // Task managers
  const handleOpenTaskDrawer = (task = null, preferredColumn = 'todo') => {
    setSelectedTask(task);
    setTargetColumnId(preferredColumn);
    setIsDrawerOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        // 1. Update existing task
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.dueDate || null,
            assignee: taskData.assignee,
            column_id: taskData.columnId
          })
          .eq('id', taskData.id);

        if (taskError) throw taskError;

        // 2. Manage subtasks modifications (delete old, insert updated)
        const { error: subDeleteError } = await supabase
          .from('subtasks')
          .delete()
          .eq('task_id', taskData.id);

        if (subDeleteError) throw subDeleteError;

        if (taskData.subtasks && taskData.subtasks.length > 0) {
          const subtaskPayload = taskData.subtasks.map(s => ({
            task_id: taskData.id,
            title: s.title,
            completed: s.completed || false
          }));
          const { error: subInsertError } = await supabase
            .from('subtasks')
            .insert(subtaskPayload);

          if (subInsertError) throw subInsertError;
        }
        addToast('Task updated successfully.', 'success');
        handleLogActivity(taskData.projectId || activeProjectId, taskData.title, 'edited', `Task details were edited.`);

      } else {
        // 1. Insert new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert([{
            project_id: activeProjectId,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.dueDate || null,
            assignee: taskData.assignee,
            column_id: taskData.columnId
          }])
          .select()
          .single();

        if (taskError) throw taskError;

        // 2. Insert new subtasks associated with the created task
        if (newTask && taskData.subtasks && taskData.subtasks.length > 0) {
          const subtaskPayload = taskData.subtasks.map(s => ({
            task_id: newTask.id,
            title: s.title,
            completed: s.completed || false
          }));
          const { error: subInsertError } = await supabase
            .from('subtasks')
            .insert(subtaskPayload);

          if (subInsertError) throw subInsertError;
        }
        addToast('Task created successfully.', 'success');
        handleLogActivity(activeProjectId, taskData.title, 'created', `Task was created.`);
      }

      // Re-fetch database state to update view correctly
      await fetchInitialData(false);
    } catch (err) {
      console.error('Error saving task:', err.message);
      addToast(`Failed to save task: ${err.message}`, 'error');
    }
    setIsDrawerOpen(false);
  };

  const executeDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
      addToast('Task deleted.', 'success');
      handleLogActivity(taskToDelete.projectId, taskToDelete.title, 'deleted', `Task "${taskToDelete.title}" was deleted.`);
    } catch (err) {
      console.error('Error deleting task:', err.message);
      addToast(`Failed to delete task: ${err.message}`, 'error');
    }
  };

  const handleDeleteTask = (taskId) => {
    const t = tasks.find(x => x.id === taskId);
    if (t) {
      setDeleteConfirmation({ type: 'task', id: taskId, name: t.title });
    }
  };

  const handleTaskMove = async (taskId, targetColumnId) => {
    // Locate initial state for rollback
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;
    const previousColumnId = originalTask.columnId;

    try {
      // 1. Optimistic local state update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, columnId: targetColumnId } : t));
      
      const columnName = COLUMNS.find(c => c.id === targetColumnId)?.title || targetColumnId;
      addToast(`Moved to ${columnName}`, 'success');

      // 2. Supposed database modification call
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: targetColumnId })
        .eq('id', taskId);

      if (error) throw error;

      const originalColName = COLUMNS.find(c => c.id === previousColumnId)?.title || previousColumnId;
      handleLogActivity(originalTask.projectId, originalTask.title, 'moved', `Moved from "${originalColName}" to "${columnName}".`);
    } catch (err) {
      console.error('Error moving task:', err.message);
      
      // Rollback optimistic update on Supabase failure
      setTasks(tasks.map(t => t.id === taskId ? { ...t, columnId: previousColumnId } : t));
      addToast(`Failed to move task: ${err.message}. Snapping back.`, 'error');
    }
  };

  const handleToggleSubtaskDirectly = async (taskId, subtaskId, currentCompleted) => {
    const nextCompleted = !currentCompleted;
    const taskObj = tasks.find(t => t.id === taskId);
    const subtaskObj = taskObj?.subtasks?.find(s => s.id === subtaskId);

    try {
      // Optimistic state update locally
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: nextCompleted } : s)
          };
        }
        return t;
      }));

      const { error } = await supabase
        .from('subtasks')
        .update({ completed: nextCompleted })
        .eq('id', subtaskId);

      if (error) throw error;

      if (taskObj && subtaskObj) {
        handleLogActivity(
          taskObj.projectId,
          taskObj.title,
          nextCompleted ? 'completed' : 'edited',
          `Subtask "${subtaskObj.title}" was marked as ${nextCompleted ? 'completed' : 'incomplete'}.`
        );
      }
    } catch (err) {
      console.error('Error toggling subtask:', err.message);
      await fetchInitialData(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
    } catch (err) {
      console.error('Error logging out:', err.message);
    }
  };

  // Enhance project count badges dynamically
  const enrichedProjects = projects.map(p => ({
    ...p,
    tasksCount: tasks.filter(t => t.projectId === p.id).length
  }));

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const userRole = activeProject 
    ? (activeProject.user_id === session?.user?.id 
        ? 'owner' 
        : (projectMembers.find(m => m.project_id === activeProject.id && m.email === session?.user?.email)?.role || 'member'))
    : 'member';

  const invitedProjects = projects.filter(p => p.user_id !== session?.user?.id);

  // Route to auth wrapper if no active session
  // Show spinner only while checking initial session token
  if (!session && loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0c10',
        color: '#f0f4f9',
        fontSize: '18px',
        fontWeight: '600',
        fontFamily: 'Outfit, sans-serif'
      }}>
        Connecting to Supabase Workspace...
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={(activeSession) => setSession(activeSession)} />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          projects={enrichedProjects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          onDeleteProject={handleDeleteProject}
          onUpdateProjectColor={handleUpdateProjectColor}
          user={session.user}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        />

        <main className="main-content">
          <header className="content-header">
            <div className="content-title">
              <h1>{activeProject ? activeProject.name : 'No Projects Created'}</h1>
              <p>
                {currentTab === 'dashboard' && 'Workspace statistics & overview'}
                {currentTab === 'board' && 'Visual workflow and task tracking'}
                {currentTab === 'list' && 'Task logs list filter & management'}
              </p>
            </div>

            <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="notification-btn-container" style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsNotificationsOpen(prev => !prev)} 
                  className="btn btn-secondary"
                  title="Notifications"
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Bell size={16} />
                  {invitedProjects.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--danger)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%'
                    }} />
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="project-menu-dropdown glass-card fade-in" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 60,
                    width: '260px',
                    padding: '16px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Notifications</h4>
                      {invitedProjects.length > 0 && (
                        <span style={{ fontSize: '10px', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '10px', fontWeight: '600' }}>
                          {invitedProjects.length} New
                        </span>
                      )}
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }} className="custom-scroll">
                      {invitedProjects.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                          No new notifications.
                        </p>
                      ) : (
                        invitedProjects.map(proj => {
                          const memberRecord = projectMembers.find(m => m.project_id === proj.id && m.email === session?.user?.email);
                          const role = memberRecord ? memberRecord.role : 'member';
                          return (
                            <div key={proj.id} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--primary-bg)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}>
                                <Bell size={11} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                  Added to project <strong style={{ color: proj.color }}>{proj.name}</strong> as <strong>{role}</strong>.
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowShortcutsLegend(true)} 
                className="btn btn-secondary"
                title="Keyboard Shortcuts"
              >
                <Keyboard size={16} />
              </button>
              {activeProjectId && (
                <button 
                  onClick={() => setIsMembersModalOpen(true)} 
                  className="btn btn-secondary"
                  title="Project Members"
                >
                  <Users size={16} />
                  <span>Members</span>
                </button>
              )}
              {currentTab !== 'dashboard' && activeProjectId && (
                <button 
                  onClick={() => handleOpenTaskDrawer(null, 'todo')} 
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  <span>New Task</span>
                </button>
              )}
            </div>
          </header>

          <div className="tab-view-content" style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px',
                textAlign: 'center',
                color: '#8b9bb4'
              }}>
                <h2 style={{ color: '#f0f4f9', marginBottom: '8px' }}>Create Your First Project</h2>
                <p style={{ marginBottom: '16px' }}>Start planning and organizing your team tasks by setting up your first project workspace.</p>
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  <Plus size={16} />
                  <span>Create Project</span>
                </button>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <Dashboard 
                    tasks={tasks} 
                    projects={projects} 
                    activeProjectId={activeProjectId} 
                    loading={loading}
                    activityLogs={activityLogs}
                    user={session.user}
                    projectMembers={projectMembers}
                  />
                )}

                {currentTab === 'board' && (
                  <KanbanBoard
                    tasks={tasks}
                    activeProjectId={activeProjectId}
                    columns={COLUMNS}
                    onTaskMove={handleTaskMove}
                    onEditTask={(task) => handleOpenTaskDrawer(task, task.columnId)}
                    onDeleteTask={handleDeleteTask}
                    onOpenTaskModal={handleOpenTaskDrawer}
                    onToggleSubtask={handleToggleSubtaskDirectly}
                    loading={loading}
                  />
                )}

                {currentTab === 'list' && (
                  <ListView
                    tasks={tasks}
                    activeProjectId={activeProjectId}
                    onEditTask={(task) => handleOpenTaskDrawer(task, task.columnId)}
                    onDeleteTask={handleDeleteTask}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>
        </main>

        <TaskDrawer
          task={selectedTask}
          columnId={targetColumnId}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveTask}
          userRole={userRole}
        />

        {isMembersModalOpen && activeProject && (
          <div className="modal-backdrop" onClick={() => setIsMembersModalOpen(false)}>
            <div className="modal-container glass-card fade-in members-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Project Members ({activeProject.name})</h3>
                <button className="btn-close-drawer" onClick={() => setIsMembersModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div className="nav-section-title" style={{ margin: '0 0 8px 0', padding: 0 }}>Current Members</div>
                <div className="members-list">
                  {/* Creator / Owner */}
                  <div className="member-row">
                    <div className="member-info">
                      <div className="member-avatar">
                        {activeProject.user_id === session?.user?.id ? 'ME' : 'OW'}
                      </div>
                      <span className="member-email">
                        {activeProject.user_id === session?.user?.id ? session.user.email : 'Project Owner'}
                      </span>
                    </div>
                    <span className="role-badge owner">Owner</span>
                  </div>

                  {/* Other members */}
                  {projectMembers.filter(m => m.project_id === activeProject.id).map(m => (
                    <div key={m.id} className="member-row">
                      <div className="member-info">
                        <div className="member-avatar">
                          {m.email.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="member-email">{m.email}</span>
                      </div>
                      <span className={`role-badge ${m.role}`}>{m.role}</span>
                    </div>
                  ))}
                </div>

                {userRole === 'owner' ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const emailInput = e.target.elements.inviteEmail;
                    const roleSelect = e.target.elements.inviteRole;
                    if (emailInput.value.trim()) {
                      await handleInviteMember(activeProject.id, emailInput.value.trim(), roleSelect.value);
                      emailInput.value = '';
                    }
                  }} className="invite-form">
                    <input 
                      name="inviteEmail" 
                      type="email" 
                      placeholder="Collaborator email..." 
                      required 
                      style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    />
                    <select 
                      name="inviteRole"
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Invite</button>
                  </form>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                    Only the project owner can invite collaborators.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showShortcutsLegend && (
          <div className="modal-backdrop" onClick={() => setShowShortcutsLegend(false)}>
            <div className="modal-container glass-card fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '340px' }}>
              <div className="modal-header">
                <h3>Keyboard Shortcuts</h3>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Create New Task</span>
                  <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>N</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Focus Search Log</span>
                  <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>/</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Show Shortcut Menu</span>
                  <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>?</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Close Drawer / Modal</span>
                  <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Esc</kbd>
                </div>
                <button 
                  onClick={() => setShowShortcutsLegend(false)} 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
                >
                  Close Legend
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateProjectOpen && (
          <div className="modal-backdrop" onClick={() => setIsCreateProjectOpen(false)}>
            <div className="modal-container glass-card fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Create New Project</h3>
                <button className="btn-close-drawer" onClick={() => setIsCreateProjectOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const nameInput = e.target.elements.projectName;
                const name = nameInput.value.trim();
                if (name) {
                  await handleAddProject(name);
                  setIsCreateProjectOpen(false);
                }
              }} className="modal-form" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="projectName" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Project Name</label>
                  <input
                    id="projectName"
                    name="projectName"
                    type="text"
                    placeholder="Enter project name..."
                    autoFocus
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
                <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreateProjectOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Project</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirmation && (
          <div className="modal-backdrop" onClick={() => setDeleteConfirmation(null)}>
            <div className="modal-container glass-card fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--danger)' }}>Confirm Deletion</h3>
                <button className="btn-close-drawer" onClick={() => setDeleteConfirmation(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {deleteConfirmation.type === 'project' ? (
                    <>Are you sure you want to delete project <strong style={{ color: 'var(--danger)' }}>"{deleteConfirmation.name}"</strong>? This will permanently delete all tasks and subtasks associated with it.</>
                  ) : (
                    <>Are you sure you want to delete task <strong style={{ color: 'var(--danger)' }}>"{deleteConfirmation.name}"</strong>? This action cannot be undone.</>
                  )}
                </p>
                <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmation(null)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      background: 'var(--danger)',
                      borderColor: 'var(--danger)',
                      color: '#fff'
                    }}
                    onClick={async () => {
                      if (deleteConfirmation.type === 'project') {
                        await executeDeleteProject(deleteConfirmation.id, deleteConfirmation.name);
                      } else {
                        await executeDeleteTask(deleteConfirmation.id);
                      }
                      setDeleteConfirmation(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}

