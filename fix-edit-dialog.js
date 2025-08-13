// Quick test to check edit dialog functionality in production

console.log('Testing edit dialog functionality...');

// Check if DOM elements exist
const editButtons = document.querySelectorAll('[data-testid^="button-edit-"]');
console.log('Edit buttons found:', editButtons.length);

// Check if dialog components are rendered
const dialogs = document.querySelectorAll('[role="dialog"]');
console.log('Dialog elements in DOM:', dialogs.length);

// Check if the issue is with React state
console.log('Testing React state management for edit dialog...');

// Simulate clicking first edit button if available
if (editButtons.length > 0) {
  console.log('Simulating click on first edit button...');
  editButtons[0].click();
  
  setTimeout(() => {
    const dialogAfterClick = document.querySelectorAll('[role="dialog"]');
    const visibleDialogs = Array.from(dialogAfterClick).filter(d => {
      const style = window.getComputedStyle(d);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    console.log('Visible dialogs after click:', visibleDialogs.length);
    console.log('All dialogs after click:', dialogAfterClick.length);
    
    // Check for overlay
    const overlay = document.querySelector('[data-radix-dialog-overlay]');
    console.log('Dialog overlay present:', !!overlay);
    if (overlay) {
      console.log('Overlay display:', window.getComputedStyle(overlay).display);
    }
  }, 500);
}