/**
 * PWA Module
 * Handles service worker registration and install prompt
 */

const PWA = {
    deferredPrompt: null,

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
    },

    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => {
                    console.log('Service worker registered');
                })
                .catch((err) => {
                    console.error('Service worker registration failed:', err);
                });
        });
    },

    setupInstallPrompt() {
        const installBtn = document.getElementById('installAppBtn');
        if (!installBtn) return;

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredPrompt = event;
            installBtn.classList.remove('hidden');
        });

        installBtn.addEventListener('click', async () => {
            if (!this.deferredPrompt) return;
            this.deferredPrompt.prompt();
            await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            installBtn.classList.add('hidden');
        });

        window.addEventListener('appinstalled', () => {
            installBtn.classList.add('hidden');
            this.deferredPrompt = null;
        });
    }
};
