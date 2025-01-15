import { viewManager } from './viewManager.js';

// Initialize add book button click handler
document.querySelector('.add-book button').addEventListener('click', () => {
    viewManager.handleAddBook();
});

// Set initial view
viewManager.updateView('list');
