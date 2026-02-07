// TodoLite - Simple Task Management with Local Storage
// Get DOM elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Load tasks from local storage on page load
let tasks = [];
try {
    tasks = JSON.parse(localStorage.getItem('todoLiteTasks')) || [];
} catch (e) {
    console.error("Error parsing tasks from localStorage:", e);
    // If parsing fails, clear localStorage for this key and start with an empty array
    localStorage.removeItem('todoLiteTasks');
    tasks = [];
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    
    // Add task on button click
    addTaskBtn.addEventListener('click', addTask);
    
    // Add task on Enter key press
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
});

// Add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    
    // Clear input
    taskInput.value = '';
    taskInput.focus();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Toggle task completion
function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Edit a task
function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    const newText = prompt('Edit task:', task.text);
    
    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

// Save tasks to local storage
function saveTasks() {
    localStorage.setItem('todoLiteTasks', JSON.stringify(tasks));
}

// Render all tasks
function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li style="text-align: center; color: #999; border: none; background: none;">No tasks yet. Add one above!</li>';
        return;
    }
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        
        // Task text container
        const taskTextSpan = document.createElement('span');
        taskTextSpan.textContent = task.text;
        taskTextSpan.style.cursor = 'pointer';
        taskTextSpan.style.flex = '1';
        taskTextSpan.addEventListener('click', () => toggleComplete(task.id));
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.backgroundColor = '#5bc0de';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(task.id);
        });
        editBtn.addEventListener('mouseenter', () => {
            editBtn.style.backgroundColor = '#46b8da';
        });
        editBtn.addEventListener('mouseleave', () => {
            editBtn.style.backgroundColor = '#5bc0de';
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        
        li.appendChild(taskTextSpan);
        li.appendChild(buttonContainer);
        taskList.appendChild(li);
    });
}

// Clear all completed tasks (bonus feature)
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}
