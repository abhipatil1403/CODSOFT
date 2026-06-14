import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Layers,
  Bell
} from 'lucide-react';

export default function Dashboard({ 
  tasks, 
  projects, 
  activeProjectId, 
  loading, 
  activityLogs = [], 
  user = null, 
  projectMembers = [] 
}) {
  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectLogs = activityLogs.filter(l => l.project_id === activeProjectId);
  
  // Filter tasks belonging to active project
  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  // Stats calculation
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.columnId === 'done').length;
  const inProgressTasks = projectTasks.filter(t => t.columnId === 'in-progress' || t.columnId === 'in-review').length;
  const pendingTasks = projectTasks.filter(t => t.columnId === 'todo').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task distribution by priority
  const lowPriorityCount = projectTasks.filter(t => t.priority === 'low').length;
  const mediumPriorityCount = projectTasks.filter(t => t.priority === 'medium').length;
  const highPriorityCount = projectTasks.filter(t => t.priority === 'high').length;

  // Recent Tasks
  const recentTasks = [...projectTasks]
    .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="dashboard-view fade-in">
        <div className="dashboard-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card glass-card" style={{ height: '88px', animation: 'pulse-glow 1.5s infinite' }}></div>
          ))}
        </div>
        <div className="dashboard-charts-grid">
          <div className="chart-card glass-card" style={{ height: '240px', animation: 'pulse-glow 1.5s infinite' }}></div>
          <div className="chart-card glass-card" style={{ height: '240px', animation: 'pulse-glow 1.5s infinite' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view fade-in">
      <div className="dashboard-grid">
        {/* Stat Cards */}
        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper progress-icon">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Tasks</span>
            <h3 className="stat-value">{totalTasks}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper success-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <h3 className="stat-value">{completedTasks}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper info-icon">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">In Progress</span>
            <h3 className="stat-value">{inProgressTasks}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon-wrapper warning-icon">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completion Rate</span>
            <h3 className="stat-value">{completionRate}%</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        {/* Project Health Card */}
        <div className="chart-card glass-card">
          <h3 className="card-title">Project Status Overview</h3>
          <div className="progress-radial-container">
            <div className="radial-progress-bar" style={{
              background: `conic-gradient(var(--primary) ${completionRate * 3.6}deg, var(--bg-tertiary) 0deg)`
            }}>
              <div className="radial-inner-circle">
                <span className="radial-value">{completionRate}%</span>
                <span className="radial-label">Done</span>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot completed"></span>
              <span>Completed ({completedTasks})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot ongoing"></span>
              <span>Remaining ({totalTasks - completedTasks})</span>
            </div>
          </div>
        </div>

        {/* Priority distribution */}
        <div className="chart-card glass-card">
          <h3 className="card-title">Tasks by Priority</h3>
          <div className="priority-bars-container">
            <div className="priority-bar-item">
              <div className="bar-label-group">
                <span>High Priority</span>
                <span>{highPriorityCount} Tasks</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill high" style={{ width: `${totalTasks > 0 ? (highPriorityCount / totalTasks) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="priority-bar-item">
              <div className="bar-label-group">
                <span>Medium Priority</span>
                <span>{mediumPriorityCount} Tasks</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill medium" style={{ width: `${totalTasks > 0 ? (mediumPriorityCount / totalTasks) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="priority-bar-item">
              <div className="bar-label-group">
                <span>Low Priority</span>
                <span>{lowPriorityCount} Tasks</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill low" style={{ width: `${totalTasks > 0 ? (lowPriorityCount / totalTasks) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <div className="recent-activity-section glass-card" style={{ marginTop: 0 }}>
          <h3 className="card-title">Recently Added Tasks</h3>
          {recentTasks.length === 0 ? (
            <div className="empty-recent-state">
              <Calendar size={32} className="empty-icon" />
              <p>No tasks created yet in this project.</p>
            </div>
          ) : (
            <div className="recent-tasks-list">
              {recentTasks.map(task => (
                <div key={task.id} className="recent-task-row">
                  <div className="recent-task-row-inner" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="recent-task-info">
                      <span className={`priority-indicator ${task.priority}`}></span>
                      <div>
                        <h4 className="recent-task-title">{task.title}</h4>
                        <p className="recent-task-desc">{task.description || 'No description provided.'}</p>
                      </div>
                    </div>
                    <div className="recent-task-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`status-pill ${task.columnId}`}>
                        {task.columnId.replace('-', ' ')}
                      </span>
                      {task.dueDate && <span className="task-date-pill" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{task.dueDate}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recent-activity-section glass-card" style={{ marginTop: 0 }}>
          <h3 className="card-title">Project Activity Feed</h3>
          {projectLogs.length === 0 ? (
            <div className="empty-recent-state">
              <Clock size={32} className="empty-icon" />
              <p>No activity logs recorded yet.</p>
            </div>
          ) : (
            <div className="activity-feed-container">
              {projectLogs.map(log => {
                let iconClass = log.action; // 'created', 'edited', 'moved', 'completed', 'deleted'
                return (
                  <div key={log.id} className="activity-item">
                    <div className={`activity-icon-wrapper ${iconClass}`}>
                      <Clock size={12} />
                    </div>
                    <div className="activity-details">
                      <p className="activity-text" style={{ fontSize: '13px', margin: 0 }}>
                        <strong>{log.user_email.split('@')[0]}</strong> {log.details}
                      </p>
                      <div className="activity-meta" style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Task: {log.task_title}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
