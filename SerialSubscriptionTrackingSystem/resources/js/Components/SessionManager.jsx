import React, { useState, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

/**
 * SessionExpiredModal - Shows when user session expires
 */
export function SessionExpiredModal({ isOpen, onClose }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    if (!isOpen) return null;

    const handleLogin = async () => {
        setIsLoggingOut(true);
        try {
            // Force logout to clear server-side session before redirecting
            await axios.post('/logout');
        } catch (error) {
            // Ignore errors - session may already be invalid
            console.log('Logout during session expiry:', error);
        }
        // Clear any stored data and force redirect to login
        window.location.replace('/login');
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}>
                {/* Warning Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <svg 
                        width="32" 
                        height="32" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#D97706"
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>

                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '12px',
                }}>
                    Session Expired
                </h2>

                <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    marginBottom: '24px',
                    lineHeight: '1.5',
                }}>
                    Your session has expired due to inactivity. Please log in again to continue.
                </p>

                <button
                    onClick={handleLogin}
                    disabled={isLoggingOut}
                    style={{
                        backgroundColor: isLoggingOut ? '#6B7280' : '#004A98',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 32px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                        width: '100%',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => !isLoggingOut && (e.target.style.backgroundColor = '#003670')}
                    onMouseOut={(e) => !isLoggingOut && (e.target.style.backgroundColor = '#004A98')}
                >
                    {isLoggingOut ? 'Redirecting...' : 'Log In Again'}
                </button>
            </div>
        </div>
    );
}

/**
 * SessionWarningModal - Shows warning before session expires
 */
export function SessionWarningModal({ isOpen, secondsRemaining, onExtend, onLogout }) {
    if (!isOpen) return null;

    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '420px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
                {/* Clock Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#DBEAFE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <svg 
                        width="32" 
                        height="32" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#2563EB"
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                </div>

                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '12px',
                }}>
                    Session Expiring Soon
                </h2>

                <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    marginBottom: '8px',
                    lineHeight: '1.5',
                }}>
                    Your session will expire in
                </p>

                <p style={{
                    color: '#DC2626',
                    fontSize: '28px',
                    fontWeight: '700',
                    marginBottom: '20px',
                }}>
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </p>

                <p style={{
                    color: '#6B7280',
                    fontSize: '13px',
                    marginBottom: '24px',
                }}>
                    Click "Stay Logged In" to extend your session.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            flex: 1,
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                    >
                        Log Out
                    </button>
                    <button
                        onClick={onExtend}
                        style={{
                            flex: 1,
                            backgroundColor: '#004A98',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#003670'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#004A98'}
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * useSessionManager - Hook to manage session expiration
 */
export function useSessionManager(options = {}) {
    const { 
        warningTime = 300, // Show warning 5 minutes before expiration
        checkInterval = 60, // Check every 60 seconds
    } = options;

    const { session, auth } = usePage().props;
    const [showWarning, setShowWarning] = useState(false);
    const [showExpired, setShowExpired] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(0);

    // Extend session by making a request
    const extendSession = useCallback(async () => {
        try {
            // Make a simple request to refresh the session
            await axios.get('/api/session/check');
            setShowWarning(false);
            setSecondsRemaining(0);
        } catch (error) {
            if (error.response?.status === 401) {
                setShowExpired(true);
            }
        }
    }, []);

    // Handle logout
    const handleLogout = useCallback(() => {
        router.post('/logout');
    }, []);

    // Check session status
    useEffect(() => {
        if (!auth?.user) return;

        const checkSession = () => {
            const now = Date.now();
            const expiresAt = session?.expires_at;

            if (!expiresAt) return;

            const timeRemaining = Math.floor((expiresAt - now) / 1000);

            if (timeRemaining <= 0) {
                setShowExpired(true);
                setShowWarning(false);
            } else if (timeRemaining <= warningTime) {
                setSecondsRemaining(timeRemaining);
                setShowWarning(true);
            } else {
                setShowWarning(false);
            }
        };

        // Initial check
        checkSession();

        // Set up interval
        const intervalId = setInterval(checkSession, 1000);

        return () => clearInterval(intervalId);
    }, [auth?.user, session?.expires_at, warningTime]);

    // Countdown timer for warning modal
    useEffect(() => {
        if (!showWarning || secondsRemaining <= 0) return;

        const timerId = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 1) {
                    setShowExpired(true);
                    setShowWarning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [showWarning]);

    return {
        showWarning,
        showExpired,
        secondsRemaining,
        extendSession,
        handleLogout,
    };
}

/**
 * SessionManager - Component that manages session expiration UI
 * Use this inside an Inertia context (not at the app root)
 */
export default function SessionManager() {
    const {
        showWarning,
        showExpired,
        secondsRemaining,
        extendSession,
        handleLogout,
    } = useSessionManager();

    return (
        <>
            <SessionWarningModal
                isOpen={showWarning}
                secondsRemaining={secondsRemaining}
                onExtend={extendSession}
                onLogout={handleLogout}
            />
            <SessionExpiredModal
                isOpen={showExpired}
            />
        </>
    );
}
