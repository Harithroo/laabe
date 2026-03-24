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
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (window.__laabeSwReloading) return;
                window.__laabeSwReloading = true;
                window.location.reload();
            });

            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
                .then((registration) => {
                    console.log('Service worker registered');

                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }

                    registration.addEventListener('updatefound', () => {
                        const installing = registration.installing;
                        if (!installing) return;
                        installing.addEventListener('statechange', () => {
                            if (installing.state === 'installed' && registration.waiting) {
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            }
                        });
                    });

                    registration.update().catch(() => {});
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
