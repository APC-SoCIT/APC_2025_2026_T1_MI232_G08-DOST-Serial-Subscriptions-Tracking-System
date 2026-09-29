import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { buildSpeechSegments, normalizeSpeechText } from '@/utils/tts';

const STORAGE_KEY_PREFIX = 'pwd-accessibility-settings-user';
const MIN_FONT_STEP = 0;
const MAX_FONT_STEP = 10;
const DEFAULT_FONT_STEP = 0;
const FONT_STEP_STEP = 0.08;

const defaultSettings = {
    enabled: false,
    readWhileTyping: false,
    fontSize: DEFAULT_FONT_STEP,
};

const normalizeFontSize = (value) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
        return DEFAULT_FONT_STEP;
    }

    return Math.min(MAX_FONT_STEP, Math.max(MIN_FONT_STEP, Math.round(nextValue)));
};

const AccessibilityContext = createContext(null);

const getUserStorageKey = (user) => {
    if (!user?.id && user?.email) {
        return `${STORAGE_KEY_PREFIX}:${user.email}`;
    }

    return user?.id ? `${STORAGE_KEY_PREFIX}:${user.id}` : `${STORAGE_KEY_PREFIX}:guest`;
};

const loadSettings = (user) => {
    if (typeof window === 'undefined') return defaultSettings;

    const key = getUserStorageKey(user);

    try {
        const raw = JSON.parse(window.localStorage.getItem(key) || '{}');
        return {
            ...defaultSettings,
            ...raw,
            fontSize: normalizeFontSize(raw.fontSize ?? defaultSettings.fontSize),
        };
    } catch {
        return defaultSettings;
    }
};

export function AccessibilityProvider({ children, user }) {
    const [currentUser, setCurrentUser] = useState(user);
    const storageKey = useMemo(() => getUserStorageKey(currentUser), [currentUser?.id, currentUser?.email]);

    const [settings, setSettings] = useState(() => loadSettings(currentUser));
    const [settingsStorageKey, setSettingsStorageKey] = useState(storageKey);
    const [speechState, setSpeechState] = useState('idle');

    useEffect(() => {
        const removeListener = router.on('navigate', (event) => {
            setCurrentUser(event.detail.page.props.auth?.user);
        });

        return removeListener;
    }, []);

    useEffect(() => {
        setSettings(loadSettings(currentUser));
        setSettingsStorageKey(storageKey);
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || settingsStorageKey !== storageKey) return;
        window.localStorage?.setItem(storageKey, JSON.stringify(settings));
    }, [settings, settingsStorageKey, storageKey]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        if (!settings.enabled) {
            document.documentElement.style.removeProperty('--pwd-font-scale');
            document.documentElement.style.removeProperty('--pwd-font-size-base');
            document.documentElement.style.removeProperty('font-size');
            return;
        }

        const scale = 1 + (normalizeFontSize(settings.fontSize) * FONT_STEP_STEP);
        document.documentElement.style.setProperty('--pwd-font-scale', String(scale));
        document.documentElement.style.setProperty('--pwd-font-size-base', `${16 * scale}px`);
        document.documentElement.style.setProperty('font-size', `${scale}rem`);
    }, [settings.enabled, settings.fontSize]);

    useEffect(() => {
        if (!settings.enabled) {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            setSpeechState('idle');
        }
    }, [settings.enabled]);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setSpeechState('idle');
    }, []);

    const read = useCallback((value) => {
        if (!settings.enabled || typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            return false;
        }

        const text = normalizeSpeechText(value || '');
        if (!text) return false;

        const segments = buildSpeechSegments(text);
        if (!segments.length) return false;

        stop();

        let index = 0;
        const speakNext = () => {
            const segment = segments[index];
            if (!segment) {
                setSpeechState('idle');
                return;
            }

            const utterance = new SpeechSynthesisUtterance(segment.text);
            utterance.lang = segment.lang || 'en-US';
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.onstart = () => setSpeechState('speaking');
            utterance.onpause = () => setSpeechState('paused');
            utterance.onresume = () => setSpeechState('speaking');
            utterance.onend = () => {
                index += 1;
                if (index < segments.length) {
                    speakNext();
                } else {
                    setSpeechState('idle');
                }
            };
            utterance.onerror = () => {
                index += 1;
                if (index < segments.length) {
                    speakNext();
                } else {
                    setSpeechState('idle');
                }
            };

            window.speechSynthesis.speak(utterance);
            setSpeechState('speaking');
        };

        speakNext();
        return true;
    }, [settings.enabled, stop]);

    const pause = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
            window.speechSynthesis.pause();
            setSpeechState('paused');
        }
    }, []);

    const resume = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
            window.speechSynthesis.resume();
            setSpeechState('speaking');
        }
    }, []);

    useEffect(() => () => stop(), [stop]);

    const value = useMemo(() => ({
        ...settings,
        speechState,
        setSetting: (key, newValue) => setSettings((current) => {
            const next = { ...current, [key]: newValue };

            if (key === 'fontSize') {
                next.fontSize = normalizeFontSize(newValue);
            }

            if (key === 'enabled' && !newValue) {
                next.readWhileTyping = false;
                next.fontSize = DEFAULT_FONT_STEP;
            }

            return next;
        }),
        read,
        stop,
        pause,
        resume,
    }), [settings, speechState, read, stop, pause, resume]);

    return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) throw new Error('useAccessibility must be used inside AccessibilityProvider');
    return context;
}
