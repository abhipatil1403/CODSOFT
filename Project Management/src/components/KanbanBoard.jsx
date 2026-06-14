import React, { useState } from 'react';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  CheckSquare, 
  Edit2, 
  Trash2,
  ListTodo
} from 'lucide-react';

export default function KanbanBoard({ 
  tasks, 
  activeProjectId, 
  columns, 
  onTaskMove, 
  onEditTask, 
  onDeleteTask, 
  onOpenTaskModal,
  onToggleSubtask,
  loading
}) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Filter tasks for active project
  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onTaskMove(taskId, targetColumnId);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="kanban-board fade-in">
      <div className="board-columns-container">
        {columns.map((column) => {
          const columnTasks = projectTasks.filter(t => t.columnId === column.id);
          
          return (
            <div 
              key={column.id} 
              className="board-column glass-card"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="column-header">
                <div className="column-header-title">
                  <span className={`column-status-dot ${column.id}`}></span>
                  <h3>{column.title}</h3>
                  <span className="column-count">{columnTasks.length}</span>
                </div>
                {column.id === 'todo' && (
                  <button 
                    onClick={() => onOpenTaskModal(null, 'todo')} 
                    className="btn-add-task-inline"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              <div className="column-cards-list">
                {loading ? (
                  <>
                    <div className="task-card-skeleton">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line desc"></div>
                      <div className="skeleton-line footer"></div>
                    </div>
                    <div className="task-card-skeleton">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line desc"></div>
                    </div>
                  </>
                ) : columnTasks.length === 0 ? (
                  <div 
                    className="empty-column-placeholder"
                    onClick={() => onOpenTaskModal(null, column.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px 16px',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.01)',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    title="Click to add task in this column"
                  >
                    <Plus size={14} style={{ marginBottom: '4px' }} />
                    <span>Drop tasks or click to add</span>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
                    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
                    
                    return (
                      <div
                        key={task.id}
                        className="task-card fade-in"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <div className="task-card-header">
                          <span className={`badge badge-${task.priority}`}>
                            {task.priority}
                          </span>
                          <div className="task-card-actions">
                            <button onClick={() => onEditTask(task)} title="Edit Task">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => onDeleteTask(task.id)} title="Delete Task" className="delete-hover">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h4 className="task-card-title">{task.title}</h4>
                        {task.description && (
                          <p className="task-card-description">{task.description}</p>
                        )}

                        {totalSubtasks > 0 && (
                          <div className="task-subtasks-progress">
                            <div className="progress-text-row">
                              <span className="subtasks-icon-group">
                                <ListTodo size={12} />
                                <span>Subtasks</span>
                              </span>
                              <span>{completedSubtasks}/{totalSubtasks}</span>
                            </div>
                            <div className="progress-bar-track">
                              <div 
                                className="progress-bar-fill" 
                                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                              ></div>
                            </div>
                            
                            {/* Interactive checklist of subtask names */}
                            <div className="task-subtasks-checklist-preview">
                              {task.subtasks.map(s => (
                                <button 
                                  key={s.id} 
                                  className="subtask-preview-item subtask-interactive-btn"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card drag trigger
                                    onToggleSubtask(task.id, s.id, s.completed);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    padding: '2px 0'
                                  }}
                                  title="Toggle Subtask"
                                >
                                  <span className={`subtask-dot ${s.completed ? 'done' : 'pending'}`}></span>
                                  <span className={`subtask-preview-text ${s.completed ? 'completed' : ''}`}>
                                    {s.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="task-card-footer">
                          {task.dueDate ? (
                            (() => {
                              const today = new Date();
                              today.setHours(0,0,0,0);
                              const due = new Date(task.dueDate);
                              const diffTime = due - today;
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              let urgencyClass = 'normal';
                              let titleText = 'Due date';
                              if (diffDays < 0) {
                                urgencyClass = 'overdue';
                                titleText = 'Overdue!';
                              } else if (diffDays <= 2) {
                                urgencyClass = 'soon';
                                titleText = 'Due soon';
                              }

                              return (
                                <div className={`task-date-group deadline-${urgencyClass}`} title={titleText}>
                                  <Calendar size={12} className={urgencyClass === 'overdue' ? 'pulse-danger-icon' : ''} />
                                  <span>{task.dueDate}</span>
                                </div>
                              );
                            })()
                          ) : (
                            <div></div>
                          )}

                          {task.assignee && (
                            <div className="task-assignee-avatar" title={task.assignee}>
                              {task.assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
