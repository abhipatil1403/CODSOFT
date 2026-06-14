import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare } from 'lucide-react';

export default function TaskModal({ 
  task, 
  columnId, 
  onClose, 
  onSave 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('todo');
  
  // Subtasks list state
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate || '');
      setAssignee(task.assignee || '');
      setStatus(task.columnId || 'todo');
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignee('');
      setStatus(columnId || 'todo');
      setSubtasks([]);
    }
  }, [task, columnId]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false }
      ]);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    setSubtasks(
      subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
    );
  };

  const handleDeleteSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(s => s.id !== subtaskId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: task ? task.id : undefined,
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      assignee: assignee.trim(),
      columnId: status,
      subtasks
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container glass-card fade-in">
        <div className="modal-header">
          <h3>{task ? 'Edit Task Details' : 'Create New Task'}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement layout design"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add project task details..."
              rows={3}
            />
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="task-date">Due Date</label>
              <input
                type="date"
                id="task-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-assignee">Assignee</label>
              <input
                type="text"
                id="task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Assignee Name"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="subtasks-form-section">
            <label>Subtasks</label>
            <div className="subtask-add-input-group">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask title..."
              />
              <button 
                type="button" 
                onClick={handleAddSubtask} 
                className="btn-add-subtask"
              >
                <Plus size={16} />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="modal-subtasks-list">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="subtask-row-item">
                    <button
                      type="button"
                      className={`btn-toggle-subtask ${subtask.completed ? 'completed' : ''}`}
                      onClick={() => handleToggleSubtask(subtask.id)}
                    >
                      <CheckSquare size={16} />
                    </button>
                    <span className={`subtask-title-label ${subtask.completed ? 'strike' : ''}`}>
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="btn-delete-subtask"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
