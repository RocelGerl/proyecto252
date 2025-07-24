document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api/tasks';
  let tasks = []; 

  const taskForm = document.getElementById('taskForm');
  const taskList = document.getElementById('taskList');
  const saveEditBtn = document.getElementById('saveEditBtn');
  let currentEditId = null;

  loadTasks();

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newTask = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      priority: document.getElementById('taskPriority').value
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      
      if (response.ok) {
        taskForm.reset();
        loadTasks();
        Swal.fire({
          icon: 'success',
          title: '¡Tarea creada!',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      showError('Error al crear la tarea');
    }
  });

  async function loadTasks() {
    try {
      const response = await fetch(API_URL);
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      showError('Error al cargar tareas');
    }
  }

  function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const row = document.createElement('tr');
      if (task.completed) row.classList.add('task-completed');
      
      row.innerHTML = `
        <td>${task.title}</td>
        <td>${task.description || '-'}</td>
        <td>
          <span class="badge ${getPriorityBadgeClass(task.priority)}">
            ${task.priority.toUpperCase()}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editTask(${task.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger me-2" onclick="deleteTask(${task.id})">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn btn-sm ${task.completed ? 'btn-success' : 'btn-outline-secondary'}" 
                  onclick="toggleComplete(${task.id}, ${task.completed})">
            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-check'}"></i>
          </button>
        </td>
      `;
      taskList.appendChild(row);
    });
  }

  window.editTask = (id) => {
    currentEditId = id;
    const task = tasks.find(t => t.id === id);
    
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description || '';
    document.getElementById('editPriority').value = task.priority;
    
    const modal = new bootstrap.Modal('#editModal');
    modal.show();
  };

  saveEditBtn.addEventListener('click', async () => {
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const priority = document.getElementById('editPriority').value;

    try {
      const response = await fetch(`${API_URL}/${currentEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      });

      if (response.ok) {
        bootstrap.Modal.getInstance('#editModal').hide();
        loadTasks();
        Swal.fire({
          icon: 'success',
          title: '¡Tarea actualizada!',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      showError('Error al actualizar la tarea');
    }
  });

  window.deleteTask = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar tarea?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    });
    
    if (isConfirmed) {
      try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadTasks();
        Swal.fire('¡Eliminada!', '', 'success');
      } catch (error) {
        showError('Error al eliminar');
      }
    }
  };

  window.toggleComplete = async (id, completed) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      loadTasks();
    } catch (error) {
      showError('Error al actualizar');
    }
  };

  function getPriorityBadgeClass(priority) {
    const classes = {
      low: 'bg-info',
      medium: 'bg-warning',
      high: 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
  }

  function showError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
    });
  }
});