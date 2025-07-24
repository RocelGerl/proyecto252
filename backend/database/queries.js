// Consultas para la tabla 'tasks'
export const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

export const INSERT_TASK = `
  INSERT INTO tasks (title, description, priority)
  VALUES (?, ?, ?)
`;

export const GET_ALL_TASKS = `
  SELECT * FROM tasks
`;

export const DELETE_TASK = `
  DELETE FROM tasks WHERE id = ?
`;

export const TOGGLE_COMPLETE = `
  UPDATE tasks SET completed = ? WHERE id = ?
`;