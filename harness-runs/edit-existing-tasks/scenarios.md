# Generated Scenarios

## edit-existing-task-details: Update every editable task detail

**Priority:** required
**Method:** playwright

**Given**
- The seeded task “Finalize the product roadmap” is visible with its current details.

**When**
- The user opens that task for editing.
- The user changes its title, notes, category, priority, and due date.
- The user saves the edit.

**Then**
- Exactly one task shows the updated details.
- The original title is absent and the task completion state is unchanged.
- The browser console has no errors.

## cancel-and-validate-task-edit: Cancel changes and reject a blank title

**Priority:** required
**Method:** playwright

**Given**
- The seeded task “Finalize the product roadmap” is visible.

**When**
- The user changes the title and cancels the edit.
- The user reopens the editor, clears the title, and attempts to save.

**Then**
- Canceling restores the unchanged task without creating a duplicate.
- A blank title is not saved and the editor remains available with a visible validation indication.
- The browser console has no errors.

## persist-edited-task: Persist a committed edit across reload

**Priority:** required
**Method:** playwright

**Given**
- An existing seeded task is visible and local storage is enabled.

**When**
- The user commits a new title for the task.
- The user reloads the application.

**Then**
- The edited title remains after reload.
- The previous title does not return and no duplicate task appears.
- The browser console has no errors.

## keyboard-accessible-task-edit: Edit a task with accessible keyboard controls

**Priority:** required
**Method:** playwright

**Given**
- A keyboard user navigates to an existing task.

**When**
- The user activates the task-specific edit control with the keyboard.
- The user changes the title and saves with keyboard-operable controls.

**Then**
- The edit action, fields, Save, and Cancel controls all have accessible names.
- Focus moves to the title field when editing begins.
- The saved title is exposed in the list without relying on color or hover, and the browser console has no errors.

## preserve-edit-regressions: Preserve filtering, persistence, and existing task actions

**Priority:** required
**Method:** test

**Given**
- The application contains seeded tasks and an existing task is opened for editing.

**When**
- The task is saved with updated values and the current filters are changed.
- The edited task is completed and deleted, and a separate task is added.

**Then**
- Search and category filtering use the edited values.
- Completion, deletion, task creation, summaries, and local-storage persistence retain their existing behavior.
- Unrelated tasks remain unchanged.
