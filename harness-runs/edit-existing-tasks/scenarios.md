# Generated Scenarios

## edit-task-save-details: Edit and save every task detail

**Priority:** required  
**Method:** playwright

**Given**
- The seeded task Finalize the product roadmap is visible

**When**
- The user opens its editor
- The user changes title, notes, category, priority, and due date
- The user saves

**Then**
- The editor closes
- The updated title and metadata are displayed
- The original title is no longer displayed
- No browser console errors occur

## edit-task-cancel: Cancel discards task edits

**Priority:** required  
**Method:** playwright

**Given**
- A visible task is unchanged

**When**
- The user opens its editor
- The user modifies the title
- The user cancels

**Then**
- The original title remains
- The draft title is not displayed
- No browser console errors occur

## edit-task-title-validation: Blank titles cannot be saved

**Priority:** required  
**Method:** playwright

**Given**
- A task is in edit mode

**When**
- The user replaces its title with whitespace
- The user attempts to save

**Then**
- The editor remains open
- A validation message is exposed
- The existing task is not overwritten
- No browser console errors occur

## edit-task-persists: Saved edits persist after reload

**Priority:** required  
**Method:** playwright

**Given**
- A user has saved a valid title edit

**When**
- The page is reloaded

**Then**
- The edited title is still displayed
- The original title does not return
- No browser console errors occur

## edit-task-accessible-regression: Editing is accessible and existing actions still work

**Priority:** required  
**Method:** playwright

**Given**
- A seeded task is visible

**When**
- The user locates its descriptively named edit action
- The user opens the editor and inspects its labeled controls
- The user cancels and completes the task

**Then**
- Title, notes, category, priority, and due-date controls have accessible names
- The completion action remains functional
- No browser console errors occur
