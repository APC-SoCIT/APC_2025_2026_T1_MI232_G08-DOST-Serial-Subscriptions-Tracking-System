import React, { useEffect, useMemo, useState } from 'react';
import { FaPause, FaPlay, FaStop, FaVolumeUp } from 'react-icons/fa';
import { useAccessibility } from '@/Contexts/AccessibilityContext';
import {
    getFieldSpeech,
    getSelectionContext,
} from '@/utils/tts';

const isSelectionSensitive = (selection) => {
    if (!selection || selection.rangeCount === 0) {
        return true;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const rootNode = container && container.nodeType === Node.ELEMENT_NODE ? container : container?.parentElement;

    if (!rootNode) {
        return true;
    }

    return !!rootNode.closest('input, textarea, select, [type="password"], [data-tts-ignore="true"]');
};

const MIN_FONT_STEP = 0;
const MAX_FONT_STEP = 10;

export default function TtsControl({ label = 'Read Aloud' }) {
    const {
        enabled,
        readWhileTyping,
        fontSize,
        speechState,
        read,
        stop,
        pause,
        resume,
        setSetting,
    } = useAccessibility();
    const [selectionContext, setSelectionContext] = useState(null);
    const [position, setPosition] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

    useEffect(() => {
        const updateSelectionState = () => {
            const selection = window.getSelection();

            if (!enabled || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
                setSelectionContext(null);
                setPosition(null);
                return;
            }

            if (!selection.toString().trim() || isSelectionSensitive(selection)) {
                setSelectionContext(null);
                setPosition(null);
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const nextPosition = rect && rect.width > 0 && rect.height > 0
                ? {
                    left: Math.min(window.innerWidth - 220, Math.max(12, rect.left + (rect.width / 2) - 95)),
                    top: Math.max(12, rect.top - 58),
                }
                : null;

            setSelectionContext(getSelectionContext(selection));
            setPosition(nextPosition);
        };

        const handleSelectionChange = (event) => {
            const activeElement = document.activeElement;
            if (event?.target?.closest?.('[data-tts-control="true"]') || activeElement?.closest?.('[data-tts-control="true"]')) {
                return;
            }

            if (!enabled) {
                setSelectionContext(null);
                setPosition(null);
                return;
            }

            stop();
            updateSelectionState();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);
        document.addEventListener('touchend', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
            document.removeEventListener('touchend', handleSelectionChange);
        };
    }, [enabled, stop]);

    useEffect(() => {
        if (!enabled) {
            setSelectionContext(null);
            setPosition(null);
            stop();
        }
    }, [enabled, stop]);

    useEffect(() => {
        if (!enabled || !readWhileTyping) return undefined;

        let typingTimer;
        const announce = (text) => {
            if (!text || !isSupported) return;
            read(text);
        };
        const handleInput = (event) => {
            if (
                !readWhileTyping
                || !event.target.matches('input:not([type="password"]), textarea')
                || event.target.closest('[data-tts-control="true"]')
            ) {
                return;
            }

            window.clearTimeout(typingTimer);
            typingTimer = window.setTimeout(() => announce(getFieldSpeech(event.target)), 700);
        };
        const handleInvalid = (event) => {
            if (
                event.target.closest?.('[data-tts-control="true"]')
                || !event.target.validationMessage
            ) {
                return;
            }

            announce(event.target.validationMessage);
        };
        document.addEventListener('input', handleInput);
        document.addEventListener('invalid', handleInvalid, true);
        return () => {
            window.clearTimeout(typingTimer);
            document.removeEventListener('input', handleInput);
            document.removeEventListener('invalid', handleInvalid, true);
        };
    }, [enabled, isSupported, readWhileTyping, read]);

    const isSpeaking = speechState !== 'idle';
    const actions = enabled && selectionContext?.text ? [{ label, text: selectionContext.text, icon: <FaVolumeUp /> }] : [];
    const isHeaderMode = !position && !selectionContext;

    const buttonStyle = useMemo(() => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: isHeaderMode ? '#ffffff' : (enabled ? '#004A98' : '#ffffff'),
        border: '1px solid #004A98',
        borderRadius: 999,
        color: isHeaderMode ? '#004A98' : (enabled ? '#ffffff' : '#004A98'),
        padding: isHeaderMode ? '8px 12px' : '8px 12px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: isHeaderMode ? '0 6px 16px rgba(0,0,0,0.08)' : (enabled ? '0 8px 20px rgba(0,0,0,0.18)' : '0 8px 20px rgba(0,0,0,0.12)'),
        outline: 'none',
        transition: 'all 0.2s ease',
        minHeight: 36,
    }), [enabled, isHeaderMode]);

    if (!isSupported) {
        return null;
    }

    return (
        <div
            role="toolbar"
            aria-label={isHeaderMode ? 'PWD Accessibility settings' : 'PWD Accessibility controls'}
            data-tts-control="true"
            style={{
                position: position ? 'fixed' : 'relative',
                ...(position ? { left: position.left, top: position.top, zIndex: 9999 } : {}),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: position ? '6px 8px' : '0',
                background: position ? 'rgba(255,255,255,0.98)' : 'transparent',
                border: position ? '1px solid #e5e7eb' : 'none',
                borderRadius: 12,
                boxShadow: position ? '0 12px 24px rgba(0,0,0,0.12)' : 'none',
                width: position ? 'max-content' : 'auto',
            }}
        >
            <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-expanded={settingsOpen}
                aria-label="PWD Accessibility"
                title="PWD Accessibility"
                style={{
                    ...buttonStyle,
                    padding: isHeaderMode ? '8px 12px' : '8px 12px',
                    minWidth: 54,
                    fontSize: 12,
                    letterSpacing: '0.04em',
                }}
            >
                PWD
            </button>

            {!isHeaderMode && enabled && actions.map((action) => (
                <button
                    key={action.label}
                    type="button"
                    onClick={() => (isSpeaking ? stop() : read(action.text))}
                    aria-label={isSpeaking ? 'Stop' : action.label}
                    title={isSpeaking ? 'Stop' : action.label}
                    style={buttonStyle}
                >
                    {isSpeaking ? <FaStop /> : (action.icon || <FaVolumeUp />)}
                    <span>{isSpeaking ? 'Stop' : action.label}</span>
                </button>
            ))}

            {!isHeaderMode && enabled && speechState !== 'idle' && (
                <>
                    <button
                        type="button"
                        onClick={speechState === 'paused' ? resume : pause}
                        aria-label={speechState === 'paused' ? 'Resume speech' : 'Pause speech'}
                        title={speechState === 'paused' ? 'Resume speech' : 'Pause speech'}
                        style={{ ...buttonStyle, padding: '8px 10px' }}
                    >
                        {speechState === 'paused' ? <FaPlay /> : <FaPause />}
                    </button>
                    {!selectionContext && (
                        <button
                            type="button"
                            onClick={stop}
                            aria-label="Stop speech"
                            title="Stop speech"
                            style={{ ...buttonStyle, padding: '8px 10px' }}
                        >
                            <FaStop />
                        </button>
                    )}
                </>
            )}

            {settingsOpen && (
                <div
                    role="dialog"
                    aria-label="PWD accessibility settings"
                    style={{
                        position: position ? 'fixed' : 'absolute',
                        ...(position ? { top: 64, right: 12 } : { top: 'calc(100% + 8px)', right: 0 }),
                        zIndex: 10000,
                        width: 260,
                        maxWidth: 'calc(100vw - 24px)',
                        maxHeight: 'calc(100vh - 80px)',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        padding: 14,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                        color: '#1f2937',
                        fontSize: 12,
                    }}
                >
                    <div style={{ fontWeight: 700, color: '#004A98', marginBottom: 10 }}>PWD Accessibility</div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: enabled ? 10 : 0, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => setSetting('enabled', event.target.checked)}
                        />
                        <span>Enable PWD Accessibility</span>
                    </label>

                    {enabled && (
                        <>
                            <div style={{ marginTop: 10, marginBottom: 10, paddingTop: 8, borderTop: '1px solid #eef2f7' }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Font Size</div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <button
                                        type="button"
                                        aria-label="Decrease Font Size"
                                        title="Decrease Font Size"
                                        disabled={fontSize <= MIN_FONT_STEP}
                                        onClick={() => setSetting('fontSize', Math.max(MIN_FONT_STEP, Number(fontSize) - 1))}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            border: '1px solid #004A98',
                                            background: fontSize <= MIN_FONT_STEP ? '#e5e7eb' : '#ffffff',
                                            color: fontSize <= MIN_FONT_STEP ? '#9ca3af' : '#004A98',
                                            fontSize: 20,
                                            lineHeight: 1,
                                            cursor: fontSize <= MIN_FONT_STEP ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                        }}
                                    >
                                        −
                                    </button>

                                    <div
                                        aria-live="polite"
                                        aria-atomic="true"
                                        role="status"
                                        style={{
                                            minWidth: 42,
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            color: '#004A98',
                                            fontSize: 14,
                                        }}
                                    >
                                        {Number(fontSize) || 0}
                                    </div>

                                    <button
                                        type="button"
                                        aria-label="Increase Font Size"
                                        title="Increase Font Size"
                                        disabled={fontSize >= MAX_FONT_STEP}
                                        onClick={() => setSetting('fontSize', Math.min(MAX_FONT_STEP, Number(fontSize) + 1))}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            border: '1px solid #004A98',
                                            background: fontSize >= MAX_FONT_STEP ? '#e5e7eb' : '#ffffff',
                                            color: fontSize >= MAX_FONT_STEP ? '#9ca3af' : '#004A98',
                                            fontSize: 20,
                                            lineHeight: 1,
                                            cursor: fontSize >= MAX_FONT_STEP ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={readWhileTyping}
                                    onChange={(event) => setSetting('readWhileTyping', event.target.checked)}
                                />
                                <span>Read While Typing</span>
                            </label>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
