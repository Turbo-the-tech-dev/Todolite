// TodoLite - Enhanced Task Management
// =====================================

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const priorityInput = document.getElementById('priorityInput');
const dueDateInput = document.getElementById('dueDateInput');
const tagsInput = document.getElementById('tagsInput');
const recurringInput = document.getElementById('recurringInput');
const searchInput = document.getElementById('searchInput');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const filterTag = document.getElementById('filterTag');
const sortBy = document.getElementById('sortBy');
const darkModeToggle = document.getElementById('darkModeToggle');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const notifyBtn = document.getElementById('notifyBtn');
const taskStats = document.getElementById('taskStats');

// State
let tasks = loadTasks();
let editingTaskId = null;
const notifiedTaskIds = new Set();

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    processRecurringTasks();
    updateTagFilter();
    renderTasks();
    updateNotifyButton();
    checkDueNotifications();
    setInterval(checkDueNotifications, 60000);

    // Event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    searchInput.addEventListener('input', renderTasks);
    filterPriority.addEventListener('change', renderTasks);
    filterStatus.addEventListener('change', renderTasks);
    filterTag.addEventListener('change', renderTasks);
    sortBy.addEventListener('change', renderTasks);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    clearCompletedBtn.addEventListener('click', clearCompleted);
    exportBtn.addEventListener('click', exportTasks);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTasks);
    notifyBtn.addEventListener('click', requestNotificationPermission);
});

// ==========================================
// Persistence
// ==========================================

function loadTasks() {
    try {
        return JSON.parse(localStorage.getItem('todoLiteTasks')) || [];
    } catch {
        return [];
    }
}

function saveTasks() {
    localStorage.setItem('todoLiteTasks', JSON.stringify(tasks));
}

// ==========================================
// Task CRUD
// ==========================================

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const tags = tagsInput.value.trim()
        ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t)
        : [];

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: priorityInput.value,
        dueDate: dueDateInput.value || null,
        tags: tags,
        recurring: recurringInput.value || null,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    updateTagFilter();
    renderTasks();

    // Clear inputs
    taskInput.value = '';
    tagsInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'medium';
    recurringInput.value = '';
    taskInput.focus();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    if (editingTaskId === id) editingTaskId = null;
    saveTasks();
    updateTagFilter();
    renderTasks();
}

function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;

    task.completed = !task.completed;

    // If completing a recurring task, create the next occurrence
    if (task.completed && task.recurring) {
        createNextRecurrence(task);
    }

    saveTasks();
    renderTasks();
}

function startEdit(id) {
    editingTaskId = id;
    renderTasks();
}

function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

function saveEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const panel = document.querySelector('.edit-panel');
    if (!panel) return;

    const newText = panel.querySelector('.edit-text').value.trim();
    if (newText === '') return;

    task.text = newText;
    task.priority = panel.querySelector('.edit-priority').value;
    task.dueDate = panel.querySelector('.edit-due').value || null;
    task.recurring = panel.querySelector('.edit-recurring').value || null;

    const tagStr = panel.querySelector('.edit-tags').value.trim();
    task.tags = tagStr ? tagStr.split(',').map(t => t.trim()).filter(t => t) : [];

    editingTaskId = null;
    saveTasks();
    updateTagFilter();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    updateTagFilter();
    renderTasks();
}

// ==========================================
// Recurring Tasks
// ==========================================

function createNextRecurrence(sourceTask) {
    const nextDueDate = calculateNextDueDate(sourceTask.dueDate, sourceTask.recurring);

    const newTask = {
        id: Date.now() + 1,
        text: sourceTask.text,
        completed: false,
        priority: sourceTask.priority,
        dueDate: nextDueDate,
        tags: [...sourceTask.tags],
        recurring: sourceTask.recurring,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
}

function calculateNextDueDate(currentDueDate, interval) {
    const base = currentDueDate ? new Date(currentDueDate + 'T00:00:00') : new Date();

    switch (interval) {
        case 'daily':
            base.setDate(base.getDate() + 1);
            break;
        case 'weekly':
            base.setDate(base.getDate() + 7);
            break;
        case 'monthly':
            base.setMonth(base.getMonth() + 1);
            break;
        default:
            return null;
    }

    return base.toISOString().split('T')[0];
}

function processRecurringTasks() {
    // On load, check if any incomplete recurring tasks are past due and need attention.
    // This is informational only - we don't auto-complete tasks.
    // The main recurrence logic runs when the user completes a recurring task.
}

// ==========================================
// Search, Filter, Sort
// ==========================================

function getFilteredTasks() {
    let filtered = [...tasks];

    // Search
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        filtered = filtered.filter(t =>
            t.text.toLowerCase().includes(query) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    }

    // Filter by priority
    const pFilter = filterPriority.value;
    if (pFilter) {
        filtered = filtered.filter(t => t.priority === pFilter);
    }

    // Filter by status
    const sFilter = filterStatus.value;
    if (sFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (sFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    }

    // Filter by tag
    const tFilter = filterTag.value;
    if (tFilter) {
        filtered = filtered.filter(t => t.tags && t.tags.includes(tFilter));
    }

    // Sort
    const sortField = sortBy.value;
    filtered.sort((a, b) => {
        switch (sortField) {
            case 'priority':
                return priorityWeight(a.priority) - priorityWeight(b.priority);
            case 'dueDate':
                return compareDueDates(a.dueDate, b.dueDate);
            case 'name':
                return a.text.localeCompare(b.text);
            case 'created':
            default:
                return b.id - a.id; // newest first
        }
    });

    return filtered;
}

function priorityWeight(p) {
    const weights = { high: 0, medium: 1, low: 2 };
    return weights[p] !== undefined ? weights[p] : 1;
}

function compareDueDates(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
}

// ==========================================
// Tag Filter Management
// ==========================================

function updateTagFilter() {
    const allTags = new Set();
    tasks.forEach(t => {
        if (t.tags) t.tags.forEach(tag => allTags.add(tag));
    });

    const currentVal = filterTag.value;
    filterTag.innerHTML = '<option value="">All Tags</option>';
    [...allTags].sort().forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        filterTag.appendChild(opt);
    });

    // Restore selection if still valid
    if (allTags.has(currentVal)) {
        filterTag.value = currentVal;
    }
}

// ==========================================
// Rendering
// ==========================================

function renderTasks() {
    taskList.innerHTML = '';
    const filtered = getFilteredTasks();
    updateStats(filtered);

    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.textContent = tasks.length === 0
            ? 'No tasks yet. Add one above!'
            : 'No tasks match your filters.';
        li.style.border = 'none';
        li.style.background = 'none';
        taskList.appendChild(li);
        return;
    }

    filtered.forEach(task => {
        const li = document.createElement('li');
        const classes = [];
        if (task.completed) classes.push('completed');
        if (!task.completed && isOverdue(task.dueDate)) classes.push('overdue');
        li.className = classes.join(' ');

        // Main row
        const mainRow = document.createElement('div');
        mainRow.className = 'task-main';

        // Priority dot
        const dot = document.createElement('span');
        dot.className = 'priority-dot ' + (task.priority || 'medium');
        dot.title = (task.priority || 'medium') + ' priority';

        // Task text
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;
        textSpan.addEventListener('click', () => toggleComplete(task.id));

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn-complete';
        completeBtn.textContent = task.completed ? 'Undo' : 'Done';
        completeBtn.addEventListener('click', () => toggleComplete(task.id));

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => startEdit(task.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        actions.appendChild(completeBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        mainRow.appendChild(dot);
        mainRow.appendChild(textSpan);
        mainRow.appendChild(actions);
        li.appendChild(mainRow);

        // Metadata row (due date, tags, recurring)
        if (task.dueDate || (task.tags && task.tags.length) || task.recurring) {
            const meta = document.createElement('div');
            meta.className = 'task-meta';

            if (task.dueDate) {
                const dueSpan = document.createElement('span');
                dueSpan.className = 'task-due';
                if (!task.completed && isOverdue(task.dueDate)) {
                    dueSpan.classList.add('overdue-text');
                } else if (!task.completed && isDueToday(task.dueDate)) {
                    dueSpan.classList.add('due-today');
                }
                dueSpan.textContent = formatDueDate(task.dueDate);
                meta.appendChild(dueSpan);
            }

            if (task.recurring) {
                const recSpan = document.createElement('span');
                recSpan.className = 'task-recurring';
                recSpan.textContent = 'Repeats ' + task.recurring;
                meta.appendChild(recSpan);
            }

            if (task.tags && task.tags.length) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'task-tags';
                task.tags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
                meta.appendChild(tagsDiv);
            }

            li.appendChild(meta);
        }

        // Edit panel (if editing this task)
        if (editingTaskId === task.id) {
            li.appendChild(createEditPanel(task));
        }

        taskList.appendChild(li);
    });
}

function createEditPanel(task) {
    const panel = document.createElement('div');
    panel.className = 'edit-panel';

    // Text
    const textRow = document.createElement('div');
    textRow.className = 'edit-row';
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Text';
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'edit-text';
    textInput.value = task.text;
    textRow.appendChild(textLabel);
    textRow.appendChild(textInput);

    // Priority + Due date row
    const row2 = document.createElement('div');
    row2.className = 'edit-row';

    const priLabel = document.createElement('label');
    priLabel.textContent = 'Priority';
    const priSelect = document.createElement('select');
    priSelect.className = 'edit-priority';
    ['low', 'medium', 'high'].forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        if (task.priority === p) opt.selected = true;
        priSelect.appendChild(opt);
    });

    const dueLabel = document.createElement('label');
    dueLabel.textContent = 'Due';
    const dueInput = document.createElement('input');
    dueInput.type = 'date';
    dueInput.className = 'edit-due';
    dueInput.value = task.dueDate || '';

    row2.appendChild(priLabel);
    row2.appendChild(priSelect);
    row2.appendChild(dueLabel);
    row2.appendChild(dueInput);

    // Tags + Recurring row
    const row3 = document.createElement('div');
    row3.className = 'edit-row';

    const tagLabel = document.createElement('label');
    tagLabel.textContent = 'Tags';
    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.className = 'edit-tags';
    tagInput.value = (task.tags || []).join(', ');
    tagInput.placeholder = 'Comma separated';

    const recLabel = document.createElement('label');
    recLabel.textContent = 'Repeat';
    const recSelect = document.createElement('select');
    recSelect.className = 'edit-recurring';
    [
        { value: '', label: 'None' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if ((task.recurring || '') === opt.value) o.selected = true;
        recSelect.appendChild(o);
    });

    row3.appendChild(tagLabel);
    row3.appendChild(tagInput);
    row3.appendChild(recLabel);
    row3.appendChild(recSelect);

    // Action buttons
    const actionsRow = document.createElement('div');
    actionsRow.className = 'edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => saveEdit(task.id));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', cancelEdit);

    actionsRow.appendChild(saveBtn);
    actionsRow.appendChild(cancelBtn);

    panel.appendChild(textRow);
    panel.appendChild(row2);
    panel.appendChild(row3);
    panel.appendChild(actionsRow);

    return panel;
}

function updateStats(filtered) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const overdue = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;

    let html = '<span>Total: ' + total + '</span>';
    html += '<span>Active: ' + active + '</span>';
    html += '<span>Done: ' + completed + '</span>';
    if (overdue > 0) {
        html += '<span style="color:var(--priority-high)">Overdue: ' + overdue + '</span>';
    }
    taskStats.innerHTML = html;
}

// ==========================================
// Date Helpers
// ==========================================

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    return dueDate < getTodayStr();
}

function isDueToday(dueDate) {
    if (!dueDate) return false;
    return dueDate === getTodayStr();
}

function formatDueDate(dueDate) {
    if (!dueDate) return '';
    const today = getTodayStr();

    if (dueDate === today) return 'Due today';
    if (dueDate < today) {
        const days = daysBetween(dueDate, today);
        return 'Overdue by ' + days + ' day' + (days !== 1 ? 's' : '');
    }

    const days = daysBetween(today, dueDate);
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return 'Due in ' + days + ' days';

    // Format the date nicely
    const d = new Date(dueDate + 'T00:00:00');
    return 'Due ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function daysBetween(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1 + 'T00:00:00');
    const d2 = new Date(dateStr2 + 'T00:00:00');
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// ==========================================
// Dark Mode
// ==========================================

function initDarkMode() {
    const saved = localStorage.getItem('todoLiteDarkMode');
    if (saved === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '&#9788;'; // sun symbol
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        darkModeToggle.innerHTML = '&#9789;'; // moon symbol
        localStorage.setItem('todoLiteDarkMode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '&#9788;'; // sun symbol
        localStorage.setItem('todoLiteDarkMode', 'true');
    }
}

// ==========================================
// Browser Notifications
// ==========================================

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications.');
        return;
    }

    Notification.requestPermission().then(permission => {
        updateNotifyButton();
        if (permission === 'granted') {
            checkDueNotifications();
        }
    });
}

function updateNotifyButton() {
    if ('Notification' in window && Notification.permission === 'granted') {
        notifyBtn.classList.add('notify-active');
        notifyBtn.textContent = 'Notifications On';
    } else {
        notifyBtn.classList.remove('notify-active');
        notifyBtn.textContent = 'Notifications';
    }
}

function checkDueNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = getTodayStr();

    tasks.forEach(task => {
        if (task.completed || !task.dueDate || notifiedTaskIds.has(task.id)) return;

        if (task.dueDate === today) {
            new Notification('TodoLite - Due Today', {
                body: task.text,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>'
            });
            notifiedTaskIds.add(task.id);
        } else if (task.dueDate < today) {
            new Notification('TodoLite - Overdue!', {
                body: task.text + ' (was due ' + task.dueDate + ')',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
            });
            notifiedTaskIds.add(task.id);
        }
    });
}

// ==========================================
// Import / Export (User Accounts foundation)
// ==========================================

function exportTasks() {
    const data = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        tasks: tasks
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'todolite-backup-' + getTodayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            let importedTasks;

            // Support both raw arrays and wrapped format
            if (Array.isArray(data)) {
                importedTasks = data;
            } else if (data.tasks && Array.isArray(data.tasks)) {
                importedTasks = data.tasks;
            } else {
                alert('Invalid file format.');
                return;
            }

            // Validate each task has at minimum id and text
            const valid = importedTasks.every(t => t.id && t.text);
            if (!valid) {
                alert('Invalid task data in file.');
                return;
            }

            // Merge: add imported tasks, skip duplicates by id
            const existingIds = new Set(tasks.map(t => t.id));
            let added = 0;
            importedTasks.forEach(t => {
                // Backfill missing fields for compatibility
                if (!t.priority) t.priority = 'medium';
                if (!t.tags) t.tags = [];
                if (t.dueDate === undefined) t.dueDate = null;
                if (t.recurring === undefined) t.recurring = null;
                if (!t.createdAt) t.createdAt = new Date().toISOString();

                if (!existingIds.has(t.id)) {
                    tasks.push(t);
                    added++;
                }
            });

            saveTasks();
            updateTagFilter();
            renderTasks();
            alert('Imported ' + added + ' new task' + (added !== 1 ? 's' : '') + '.');
        } catch {
            alert('Failed to read file. Make sure it is a valid JSON file.');
        }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-imported
    event.target.value = '';
}
