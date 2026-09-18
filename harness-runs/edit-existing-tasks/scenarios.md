# Generated Scenarios

## edit-task-primary-flow: Edit and save every editable task field

**Priority:** required  
**Method:** playwright

**Given**
- Daymark is open with the seeded task list
- The task 'Finalize the product roadmap' is visible

**When**
- The user opens that task's editor
- The user changes its title, notes, category, priority, and due date
- The user saves the changes

**Then**
- The editor closes
- The task displays the updated title, notes, category, priority, and due date

## edit-task-title-validation: A task cannot be saved without a title

**Priority:** required  
**Method:** playwright

**Given**
- An existing task's editor is open

**When**
- The user replaces the title with whitespace
- The user attempts to save

**Then**
- The editor stays open
- A validation message identifies the title requirement
- The original task is not overwritten

## edit-task-cancel: Cancel discards task edits

**Priority:** required  
**Method:** playwright

**Given**
- An existing task's editor is open

**When**
- The user changes one or more fields
- The user cancels editing

**Then**
- The editor closes
- The task retains its original values

## edit-task-persists: Saved task edits persist after reload

**Priority:** required  
**Method:** playwright

**Given**
- The user saved changes to an existing task

**When**
- The page is reloaded

**Then**
- The updated task values remain visible
- The browser console has no errors

## existing-task-actions-regression: Existing completion and deletion actions still work

**Priority:** required  
**Method:** test

**Given**
- Daymark is open with the seeded task list

**When**
- The user completes one task
- The user deletes a different task

**Then**
- The completed task is marked complete
- The deleted task is removed
