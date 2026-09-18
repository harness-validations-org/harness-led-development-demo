# Generated Scenarios

## edit-task-details: Save changes to every editable task detail

**Priority:** required  
**Method:** playwright

**Given**
- The seeded task Finalize the product roadmap is visible and incomplete

**When**
- The user opens its editor
- The user changes the title, notes, category, priority, and due date
- The user saves the edit

**Then**
- The same task displays all updated values
- The task remains incomplete
- No duplicate task is created

## reject-blank-edit-title: Reject an empty edited title

**Priority:** required  
**Method:** playwright

**Given**
- An existing task is open for editing

**When**
- The title is replaced with whitespace and save is attempted

**Then**
- The editor remains open
- Accessible validation feedback identifies the title problem
- The original task remains unchanged in the list and storage

## cancel-task-edit: Cancel discards unsaved changes

**Priority:** required  
**Method:** playwright

**Given**
- An existing task is open for editing

**When**
- The user changes multiple fields
- The user cancels editing

**Then**
- The original task values are displayed
- Normal complete, edit, and delete actions are available
- No draft values are persisted

## persist-and-refilter-edit: Saved edits persist and update filtering

**Priority:** required  
**Method:** playwright

**Given**
- An existing task is visible in its current date and category view

**When**
- The user edits searchable text, category, and due date and saves
- The user reloads and navigates to the matching view or filter

**Then**
- The task appears only where its updated fields match
- The updated values survive reload
- Task counts reflect the saved category and date

## editing-accessibility-and-regression: Editing is accessible without breaking existing actions

**Priority:** required  
**Method:** playwright

**Given**
- Seeded tasks are loaded

**When**
- The user locates edit controls by accessible task-specific names
- The user uses labeled edit fields and save or cancel actions
- The user adds, completes, searches for, and deletes tasks

**Then**
- Edit controls and fields have accessible names
- Focus indicators and keyboard interaction remain available
- Existing actions still work
- No browser console errors occur throughout the run
