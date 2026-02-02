document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    // Load tasks from Local Storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const listItem = document.createElement('li');
            listItem.className = task.completed ? 'completed' : '';
            listItem.innerHTML = `
                <span>${task.text}</span>
                <div>
                    <button data-index="${index}" class="complete-btn">${task.completed ? 'Uncomplete' : 'Complete'}</button>
                    <button data-index="${index}" class="delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(listItem);
        });
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            tasks.push({ text: taskText, completed: false });
            taskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }

    function toggleComplete(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    taskList.addEventListener('click', (event) => {
        if (event.target.classList.contains('complete-btn')) {
            const index = event.target.dataset.index;
            toggleComplete(parseInt(index));
        } else if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            deleteTask(parseInt(index));
        }
    });

    renderTasks();
});
