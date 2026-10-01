import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { AccessibilityProvider } from './Contexts/AccessibilityContext';
import GlobalModalFocusManager from './Components/GlobalModalFocusManager';

const appName = import.meta.env.VITE_APP_NAME || 'DOST STII-LAMS';

// Force every SweetAlert2 popup above any custom modal (which top out at z-index 10000),
// regardless of CSS load order/caching. This is a JS-level backstop for the
// `.swal2-container { z-index: ... !important; }` CSS rule in app.css.
if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const forceSwalZIndex = () => {
        document.querySelectorAll('.swal2-container').forEach((el) => {
            el.style.zIndex = '20000';
        });
    };

    const swalObserver = new MutationObserver(forceSwalZIndex);
    swalObserver.observe(document.body, { childList: true });
}

// Handle 419 (CSRF token mismatch) globally for Inertia form submissions.
// When Inertia receives a non-Inertia response (like the 419 error page),
// it fires 'invalid'. We refresh the CSRF token and reload seamlessly.
let isRetrying419 = false;

router.on('invalid', async (event) => {
    if (event.detail.response.status === 419 && !isRetrying419) {
        event.preventDefault();
        isRetrying419 = true;

        try {
            const newToken = await window.refreshCsrfToken();
            if (newToken) {
                // Reload the current Inertia page with fresh session/token
                router.reload({ preserveState: false });
            }
        } catch (e) {
            console.error('Failed to recover from 419:', e);
            window.location.reload();
        } finally {
            isRetrying419 = false;
        }
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const user = props.initialPage?.props?.auth?.user;

        root.render(
            <AccessibilityProvider user={user}>
                <GlobalModalFocusManager>
                    <App {...props} />
                </GlobalModalFocusManager>
            </AccessibilityProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});