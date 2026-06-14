import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Edit2, 
  Trash2,
  ListTodo
} from 'lucide-react';

export default function ListView({ 
  tasks, 
  activeProjectId, 
  onEditTask, 
  onDeleteTask,
  loading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  // Filters applying logic
  const filteredTasks = projectTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.columnId === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="list-view-container fade-in">
      <div className="list-view-controls glass-card">
        <div className="search-bar-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="select-filter-wrapper">
            <Filter size={14} />
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="select-filter-wrapper">
            <Filter size={14} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="done">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="list-table-wrapper glass-card">
        {loading ? (
          <table className="list-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="list-row-skeleton">
                <td><div className="skeleton-line title"></div></td>
                <td><div className="skeleton-line badge-skeleton"></div></td>
                <td><div className="skeleton-line badge-skeleton"></div></td>
                <td><div className="skeleton-line date-skeleton"></div></td>
                <td><div className="skeleton-line user-skeleton"></div></td>
                <td><div className="skeleton-line actions-skeleton"></div></td>
              </tr>
              <tr className="list-row-skeleton">
                <td><div className="skeleton-line title"></div></td>
                <td><div className="skeleton-line badge-skeleton"></div></td>
                <td><div className="skeleton-line badge-skeleton"></div></td>
                <td><div className="skeleton-line date-skeleton"></div></td>
                <td><div className="skeleton-line user-skeleton"></div></td>
                <td><div className="skeleton-line actions-skeleton"></div></td>
              </tr>
            </tbody>
          </table>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-list-state">
            <ListTodo size={40} className="empty-icon" />
            <h3>No tasks found</h3>
            <p>Try refining your search or filter inputs.</p>
          </div>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="list-row">
                  <td>
                    <div className="task-title-cell">
                      <span className={`priority-line ${task.priority}`}></span>
                      <div>
                        <h4 className="row-task-title">{task.title}</h4>
                        {task.description && (
                          <p className="row-task-desc">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${task.columnId}`}>
                      {task.columnId.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    {task.dueDate ? (
                      <div className="date-cell">
                        <Calendar size={13} />
                        <span>{task.dueDate}</span>
                      </div>
                    ) : (
                      <span className="no-date">-</span>
                    )}
                  </td>
                  <td>
                    {task.assignee ? (
                      <div className="assignee-cell">
                        <div className="assignee-avatar">
                          {task.assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span>{task.assignee}</span>
                      </div>
                    ) : (
                      <span className="no-assignee">-</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button 
                        onClick={() => onEditTask(task)} 
                        className="btn-row-action"
                        title="Edit Task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => onDeleteTask(task.id)} 
                        className="btn-row-action btn-delete"
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
