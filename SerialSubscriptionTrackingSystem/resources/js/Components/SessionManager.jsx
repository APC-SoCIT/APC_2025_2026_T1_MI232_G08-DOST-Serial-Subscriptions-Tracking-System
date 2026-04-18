import { useEffect, useRef, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

/**
 * SessionManager - Silent inactivity-based auto-logout
 * 
 * This component monitors user activity and automatically logs out
 * the user after a period of inactivity. No popups or warnings are shown.
 * 
 * Activity events monitored: mouse movement, keyboard input, clicks, touch, scroll
 */

// Default inactivity timeout in milliseconds (30 minutes)
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * useInactivityLogout - Hook to manage silent auto-logout on inactivity
 */
export function useInactivityLogout(options = {}) {
    const { 
        timeout = DEFAULT_INACTIVITY_TIMEOUT,
    } = options;

    const { auth } = usePage().props;
    const inactivityTimerRef = useRef(null);
    const isLoggingOutRef = useRef(false);

    // Silent logout function
    const performSilentLogout = useCallback(async () => {
        // Prevent multiple logout triggers
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        // Clear the timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }

        try {
            // Call backend logout endpoint
            await axios.post('/logout');
        } catch (error) {
            // Ignore errors - session may already be invalid
            console.log('Silent logout:', error);
        }

        // Redirect to login page with inactivity message
        window.location.replace('/login?reason=inactivity');
    }, []);

    // Reset the inactivity timer
    const resetTimer = useCallback(() => {
        // Don't reset if already logging out
        if (isLoggingOutRef.current) return;

        // Clear existing timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Set new timer
        inactivityTimerRef.current = setTimeout(() => {
            performSilentLogout();
        }, timeout);
    }, [timeout, performSilentLogout]);

    // Set up activity listeners
    useEffect(() => {
        // Only run for authenticated users
        if (!auth?.user) return;

        // Activity events to monitor
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'keypress',
            'touchstart',
            'touchmove',
            'scroll',
            'wheel',
            'click',
        ];

        // Throttle the reset function to avoid excessive calls
        let lastActivity = Date.now();
        const throttleMs = 1000; // Only reset timer once per second max

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivity >= throttleMs) {
                lastActivity = now;
                resetTimer();
            }
        };

        // Add event listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            // Remove event listeners
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });

            // Clear timer
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [auth?.user, resetTimer]);

    return {
        resetTimer,
    };
}

/**
 * SessionManager - Component that manages silent inactivity-based auto-logout
 * Use this inside an Inertia context (not at the app root)
 * 
 * No UI is rendered - logout happens silently after inactivity timeout
 */
export default function SessionManager() {
    // Initialize the inactivity logout hook
    useInactivityLogout();

    // No UI to render - silent auto-logout
    return null;
}
