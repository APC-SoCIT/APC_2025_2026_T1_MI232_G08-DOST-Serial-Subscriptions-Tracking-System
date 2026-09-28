import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function FocusTrap({
    children,
    active = true,
    onClose,
    returnFocusRef,
    titleId,
    descriptionId,
    alert = false,
    className = '',
}) {
    const trapRef = useRef(null);

    useEffect(() => {
        if (!active || !trapRef.current) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        const getFocusable = () => Array.from(
            trapRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
        ).filter((element) => element.getClientRects().length > 0);

        const focusInitial = () => {
            const focusable = getFocusable();
            const target = trapRef.current?.querySelector('[data-autofocus]') || focusable[0];
            target?.focus();
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && onClose) {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusable = getFocusable();
            if (!focusable.length) {
                event.preventDefault();
                trapRef.current?.focus();
                return;
            }

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
            if (!trapRef.current?.contains(event.target)) {
                focusInitial();
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('focusin', handleFocusIn, true);
        requestAnimationFrame(focusInitial);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('focusin', handleFocusIn, true);

            const focusTarget = returnFocusRef?.current || previouslyFocused;
            if (focusTarget && document.contains(focusTarget)) {
                focusTarget.focus();
            }
        };
    }, [active, onClose, returnFocusRef]);

    return (
        <div
            ref={trapRef}
            className={className}
            role={alert ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
        >
            {children}
        </div>
    );
}