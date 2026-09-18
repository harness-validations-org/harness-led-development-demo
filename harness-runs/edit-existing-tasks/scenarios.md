# Generated Scenarios

## edit-task-save-and-persist: Edit every task detail and persist the result

**Priority:** required  
**Method:** playwright

**Given**
- An existing active task is visible

**When**
- The user opens its labelled edit action
- The user changes its title, notes, category, priority, and due date
- The user saves and reloads the page

**Then**
- The updated details are displayed after save and reload
- The task identity and completion state are preserved

## edit-task-validation: Reject an empty edited title

**Priority:** required  
**Method:** playwright

**Given**
- An existing task is in edit mode

**When**
- The user replaces its title with whitespace and attempts to save

**Then**
- A clear validation message is shown
- The original task remains unchanged and the editor stays open

## edit-task-cancel: Cancel editing without changing the task

**Priority:** required  
**Method:** playwright

**Given**
- An existing task is in edit mode

**When**
- The user changes its title and chooses Cancel

**Then**
- The original title remains visible
- The unsaved title is not stored

## existing-task-actions-regression: Existing task actions continue to work

**Priority:** required  
**Method:** playwright

**Given**
- The task list is visible after using the editor

**When**
- The user adds a task, toggles completion, searches, and deletes a task

**Then**
- Each existing action still updates the list as expected
- No browser console errors occur during any required scenario
