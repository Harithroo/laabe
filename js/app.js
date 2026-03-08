/**
 * Main App File
 * Initializes the application on page load
 */

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    if (typeof PWA !== 'undefined' && PWA.init) {
        PWA.init();
    }
    console.log('Ride App Profit Calculator loaded successfully');
});

