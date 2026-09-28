import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const isVisible = (element) => element && element.getClientRects().length > 0;

const getFocusable = (container) => Array.from(
    container.querySelectorAll(FOCUSABLE_SELECTOR)
).filter(isVisible);

const getCustomOverlay = () => Array.from(document.querySelectorAll(
    '[class~="fixed"][class~="inset-0"], [style*="position: fixed"][style*="top:"][style*="left:"][style*="right:"][style*="bottom:"]'
)).filter((element) => isVisible(element)
    && !element.closest('[data-headlessui-portal]')
    && !element.querySelector('[role="dialog"]'))
    .sort((first, second) => first.getBoundingClientRect().width * first.getBoundingClientRect().height
        - second.getBoundingClientRect().width * second.getBoundingClientRect().height)
    .pop();

export default function GlobalModalFocusManager({ children }) {
    useEffect(() => {
        let activeOverlay = null;
        let previouslyFocused = null;
        let previousOverflow = '';
        let blockedTabStops = [];

        const restore = () => {
            blockedTabStops.forEach(({ element, tabIndex }) => {
                if (tabIndex === null) element.removeAttribute('tabindex');
                else element.setAttribute('tabindex', tabIndex);
                element.inert = false;
            });
            blockedTabStops = [];
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
            activeOverlay = null;
            previouslyFocused = null;
        };

        const activate = (overlay) => {
            activeOverlay = overlay;
            previouslyFocused = document.activeElement;
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const title = overlay.querySelector('h1,h2,h3,h4,h5,h6,[data-modal-title]');
            if (title) {
                if (!title.id) title.id = `modal-title-${Date.now()}`;
                overlay.setAttribute('aria-labelledby', title.id);
            }
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            document.querySelectorAll(FOCUSABLE_SELECTOR).forEach((element) => {
                if (!overlay.contains(element)) {
                    blockedTabStops.push({ element, tabIndex: element.getAttribute('tabindex') });
                    element.setAttribute('tabindex', '-1');
                    element.inert = true;
                }
            });

            requestAnimationFrame(() => getFocusable(overlay)[0]?.focus());
        };

        const handleKeyDown = (event) => {
            if (!activeOverlay) return;
            if (event.key === 'Escape') {
                const closeButton = getFocusable(activeOverlay).find((button) => {
                    const text = button.textContent.trim().toLowerCase();
                    return /^(cancel|close|dismiss|×|x)$/.test(text) || button.getAttribute('aria-label')?.toLowerCase().includes('close');
                });
                if (closeButton) {
                    event.preventDefault();
                    closeButton.click();
                }
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = getFocusable(activeOverlay);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const handleFocusIn = (event) => {
            if (activeOverlay && !activeOverlay.contains(event.target)) {
                getFocusable(activeOverlay)[0]?.focus();
            }
        };

        const sync = () => {
            const overlay = getCustomOverlay();
            if (overlay && !activeOverlay) activate(overlay);
            else if (!overlay && activeOverlay) restore();
            else if (overlay && activeOverlay && overlay !== activeOverlay) {
                restore();
                activate(overlay);
            }
        };

        const observer = new MutationObserver(sync);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('focusin', handleFocusIn, true);
        sync();

        return () => {
            observer.disconnect();
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('focusin', handleFocusIn, true);
            if (activeOverlay) restore();
        };
    }, []);

    return children;
}