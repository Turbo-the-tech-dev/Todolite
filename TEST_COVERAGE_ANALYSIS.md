# Test Coverage Analysis - TodoLite

## Current State

**Test coverage: 0%.** The project has no tests, no testing framework, and no test infrastructure. All 7 functions in `script.js` (147 lines) are completely untested.

---

## Function Inventory

| Function | Lines | Complexity | Risk | Description |
|---|---|---|---|---|
| `addTask()` | 26-47 | Medium | High | Creates task, mutates state, updates DOM and localStorage |
| `deleteTask(id)` | 50-54 | Low | High | Filters task array, persists, re-renders |
| `toggleComplete(id)` | 57-64 | Low | Medium | Flips completion flag on a task |
| `editTask(id)` | 67-78 | Medium | High | Uses `prompt()`, validates input, mutates task |
| `saveTasks()` | 81-83 | Low | Medium | Serializes tasks to localStorage |
| `renderTasks()` | 86-139 | High | High | Builds entire DOM, attaches event listeners |
| `clearCompleted()` | 143-147 | Low | Low | Filters out completed tasks |

---

## Proposed Test Plan

### Priority 1 - Unit Tests for Core Logic (High Impact, Low Effort)

These functions contain pure data-manipulation logic that can be tested in isolation with a mocked DOM and localStorage.

#### 1. `addTask()`

- **Should create a task with correct structure** (`id`, `text`, `completed: false`)
- **Should append the task to the `tasks` array**
- **Should reject empty input** (empty string, whitespace-only)
- **Should trim whitespace** from task text
- **Should clear the input field** after adding
- **Should call `saveTasks()` and `renderTasks()`**
- **Edge case:** very long task text
- **Edge case:** special characters / HTML in task text (potential XSS via `textContent` - currently safe, but worth verifying)

#### 2. `deleteTask(id)`

- **Should remove the task with the given id**
- **Should not remove other tasks**
- **Should handle deleting from a single-item list** (results in empty array)
- **Should handle an id that doesn't exist** (no-op, no crash)
- **Should call `saveTasks()` and `renderTasks()`**

#### 3. `toggleComplete(id)`

- **Should flip `completed` from `false` to `true`**
- **Should flip `completed` from `true` to `false`**
- **Should not modify other tasks**
- **Should handle a non-existent id gracefully** (no-op)
- **Should call `saveTasks()` and `renderTasks()`**

#### 4. `editTask(id)`

- **Should update task text when valid input is provided**
- **Should trim the new text**
- **Should not update if `prompt()` returns `null`** (user cancelled)
- **Should not update if `prompt()` returns empty/whitespace**
- **Should handle a non-existent id gracefully**
- **Should call `saveTasks()` and `renderTasks()` on success**

#### 5. `clearCompleted()`

- **Should remove all completed tasks**
- **Should keep all incomplete tasks**
- **Should handle an empty task list**
- **Should handle a list with no completed tasks** (no-op)
- **Should handle a list where all tasks are completed** (empties array)

### Priority 2 - Persistence Tests (Medium Impact, Low Effort)

#### 6. `saveTasks()`

- **Should write JSON to localStorage under key `'todoLiteTasks'`**
- **Should correctly serialize task objects**
- **Should handle an empty task array**

#### 7. localStorage Loading (line 8)

- **Should load tasks from localStorage on startup**
- **Should default to empty array when localStorage is empty**
- **Should handle corrupted/invalid JSON in localStorage** (currently will throw - this is a bug)

### Priority 3 - DOM / Rendering Tests (High Impact, Medium Effort)

#### 8. `renderTasks()`

- **Should render one `<li>` per task**
- **Should show "No tasks yet" message when list is empty**
- **Should apply `completed` class to completed tasks**
- **Should display task text in a `<span>`**
- **Should create Edit and Delete buttons for each task**
- **Should wire click handlers correctly** (click span toggles, click delete removes, click edit edits)

#### 9. Event Listener Setup (DOMContentLoaded block)

- **Should call `renderTasks()` on page load**
- **Should add a task when the Add button is clicked**
- **Should add a task when Enter is pressed in the input**
- **Should NOT add a task on other keypresses**

### Priority 4 - Integration / E2E Tests (High Impact, High Effort)

- **Full workflow:** add task -> verify rendered -> toggle complete -> verify style -> delete -> verify removed
- **Persistence round-trip:** add tasks -> simulate page reload -> verify tasks reloaded from localStorage
- **Multiple tasks:** add several tasks, delete some, complete some, verify correct state

---

## Identified Bugs and Risks (Discovered During Analysis)

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **No error handling for corrupted localStorage** - `JSON.parse()` on line 8 will throw if the stored value is not valid JSON, crashing the app on load | `script.js:8` | High |
| 2 | **`Date.now()` used for IDs** - rapid task creation (e.g., automated/programmatic) could produce duplicate IDs | `script.js:35` | Low |
| 3 | **Global mutable state** - `tasks` is a module-level `let` variable mutated by every function, making functions hard to test in isolation | `script.js:8` | Medium (testability) |
| 4 | **`prompt()` dependency in `editTask`** - the browser `prompt()` is hard to mock cleanly; extracting the user-input mechanism would improve testability | `script.js:71` | Medium (testability) |
| 5 | **`alert()` dependency in `addTask`** - same issue as above with `alert()` for empty input | `script.js:30` | Low (testability) |
| 6 | **No input length validation** - a user could paste megabytes of text as a task with no limit | `script.js:27` | Low |

---

## Recommended Testing Stack

Since this is a zero-dependency vanilla JS project, the testing stack should be minimal:

| Tool | Purpose |
|---|---|
| **[Vitest](https://vitest.dev/)** or **Jest** | Test runner and assertion library |
| **jsdom** (built into both) | DOM simulation for rendering tests |
| **@testing-library/dom** (optional) | Cleaner DOM assertions and queries |
| **Playwright** or **Cypress** (optional, for E2E) | Full browser integration tests |

### Suggested File Structure

```
Todolite/
  script.js
  script.test.js          # Unit + DOM tests
  index.html
  style.css
  package.json            # New: defines test scripts + devDependencies
  vitest.config.js        # New: test configuration
```

---

## Implementation Roadmap

1. **Initialize npm project** and install Vitest + jsdom
2. **Refactor `script.js` for testability** - export functions, extract `prompt()`/`alert()` calls behind injectable wrappers, and add try/catch around `JSON.parse`
3. **Write Priority 1 tests** (core logic) - this alone covers the most critical paths
4. **Write Priority 2 tests** (persistence) - covers data durability
5. **Write Priority 3 tests** (DOM rendering) - covers UI correctness
6. **Add a CI workflow** (GitHub Actions) to run tests on every push/PR

Steps 1-3 would bring the project from 0% to approximately **70-80% code coverage** and catch the majority of potential regressions.

---

## Summary

| Category | Functions | Current Coverage | Priority |
|---|---|---|---|
| Core Logic | `addTask`, `deleteTask`, `toggleComplete`, `editTask`, `clearCompleted` | 0% | **P1** |
| Persistence | `saveTasks`, localStorage init | 0% | **P2** |
| DOM Rendering | `renderTasks`, event listeners | 0% | **P3** |
| End-to-End Flows | Full user workflows | 0% | **P4** |

The highest-value improvement is adding unit tests for the 5 core logic functions (Priority 1). These are the most likely to regress during future changes, are the simplest to test, and cover the heart of the application.
