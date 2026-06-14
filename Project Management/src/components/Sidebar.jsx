import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ListTodo, 
  Plus, 
  Folder, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  LogOut,
  Sun,
  Moon,
  Trash2,
  MoreVertical
} from 'lucide-react';

const PRESET_COLORS = [
  '#4f46e5', '#a855f7', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#14b8a6', '#ec4899', '#f97316', '#64748b', '#84cc16', '#06b6d4'
];

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  projects, 
  activeProjectId, 
  setActiveProjectId, 
  onOpenCreateProject,
  onDeleteProject,
  onUpdateProjectColor,
  user,
  onLogout,
  theme,
  onToggleTheme
}) {
  const [activeMenuProjectId, setActiveMenuProjectId] = useState(null);

  useEffect(() => {
    if (!activeMenuProjectId) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.project-menu-container')) {
        setActiveMenuProjectId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMenuProjectId]);


  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Task Board', icon: FolderKanban },
    { id: 'list', label: 'List View', icon: ListTodo },
  ];

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'US';
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <FolderKanban size={24} className="brand-icon" />
        </div>
        <div className="brand-info">
          <h2>Flowspace</h2>
          <span>Workspace</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-link ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="nav-section-title projects-section-title">
          <span>Projects</span>
          <button 
            className="btn-add-project-icon" 
            onClick={onOpenCreateProject}
            title="Create Project"
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="sidebar-projects-list">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-link ${activeProjectId === project.id ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
              onClick={() => {
                setActiveProjectId(project.id);
                if (currentTab === 'dashboard') {
                  setCurrentTab('board'); // Auto-switch to board when clicking a project if in dashboard
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flexGrow: 1 }}>
                <Folder size={16} className="project-icon" style={{ color: project.color, flexShrink: 0 }} />
                <span className="project-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, position: 'relative' }} className="project-menu-container">
                <span className="project-task-count" style={{ marginLeft: 0 }}>
                  {project.tasksCount || 0}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuProjectId(activeMenuProjectId === project.id ? null : project.id);
                  }}
                  title="Project Options"
                  style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                >
                  <MoreVertical size={14} />
                </button>
                {activeMenuProjectId === project.id && (
                  <div className="project-menu-dropdown glass-card" onClick={(e) => e.stopPropagation()}>
                    <div className="project-menu-section">
                      <span className="project-menu-title">Choose Color</span>
                      <div className="color-palette-grid">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`color-dot ${project.color === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              onUpdateProjectColor(project.id, color);
                              setActiveMenuProjectId(null);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {project.user_id === user?.id && (
                      <div className="project-menu-divider" />
                    )}
                    {project.user_id === user?.id && (
                      <button
                        type="button"
                        className="project-menu-item delete"
                        onClick={() => {
                          onDeleteProject(project.id, project.name);
                          setActiveMenuProjectId(null);
                        }}
                      >
                        <Trash2 size={12} style={{ marginRight: '6px' }} />
                        <span>Delete Project</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{getInitials()}</div>
          <div className="sidebar-profile-header">
            <div className="user-details">
              <h4>{getDisplayName()}</h4>
              <p>Intern Profile</p>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button 
                onClick={onToggleTheme} 
                className="theme-toggle-btn"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                type="button"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button 
                onClick={onLogout} 
                className="btn-logout-sidebar" 
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
