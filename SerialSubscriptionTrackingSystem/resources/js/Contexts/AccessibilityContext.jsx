import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeSpeechText } from '@/utils/tts';

const STORAGE_KEY = 'pwd-accessibility-settings';
const defaultSettings = {
    enabled: false,
    readWhileTyping: false,
};

const AccessibilityContext = createContext(null);

const loadSettings = () => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
        return { ...defaultSettings, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch {
        return defaultSettings;
    }
};

export function AccessibilityProvider({ children }) {
    const [settings, setSettings] = useState(loadSettings);
    const [speechState, setSpeechState] = useState('idle');

    useEffect(() => {
        window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

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

        stop();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onstart = () => setSpeechState('speaking');
        utterance.onpause = () => setSpeechState('paused');
        utterance.onresume = () => setSpeechState('speaking');
        utterance.onend = () => setSpeechState('idle');
        utterance.onerror = () => setSpeechState('idle');
        window.speechSynthesis.speak(utterance);
        setSpeechState('speaking');
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

    useEffect(() => () => stop(), []);

    const value = useMemo(() => ({
        ...settings,
        speechState,
        setSetting: (key, enabled) => setSettings((current) => ({ ...current, [key]: enabled })),
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
