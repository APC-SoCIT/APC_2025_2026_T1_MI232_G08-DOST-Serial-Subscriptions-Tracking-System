import React, { useEffect, useState } from 'react';
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

export default function TtsControl({ label = 'Read Aloud' }) {
    const {
        enabled,
        readWhileTyping,
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
                    left: Math.min(window.innerWidth - 170, Math.max(12, rect.left + (rect.width / 2) - 75)),
                    top: Math.max(12, rect.top - 54),
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
        if (!enabled && !readWhileTyping) return undefined;

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

    if (!isSupported && enabled) {
        return null;
    }

    const actions = selectionContext?.text ? [{ label, text: selectionContext.text, icon: <FaVolumeUp /> }] : [];

    const isSpeaking = speechState !== 'idle';

    const buttonStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#ffffff',
        border: '1px solid #004A98',
        borderRadius: 999,
        color: '#004A98',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
        outline: 'none',
    };

    return (
        <div
            role="toolbar"
            aria-label="Text-to-speech controls"
            data-tts-control="true"
            style={{
                position: position ? 'fixed' : 'relative',
                ...(position ? { left: position.left, top: position.top, zIndex: 9999 } : {}),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: position ? 'rgba(255,255,255,0.98)' : 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                width: position ? 'max-content' : 'auto',
            }}
        >
            {actions.map((action) => (
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

            <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-expanded={settingsOpen}
                aria-label="TTS settings"
                title="TTS settings"
                style={{ ...buttonStyle, padding: '8px 10px' }}
            >
                <span aria-hidden="true">&#9881;</span>
            </button>

            {settingsOpen && (
                <div
                    role="dialog"
                    aria-label="TTS settings"
                    style={{
                        position: position ? 'fixed' : 'absolute',
                        ...(position ? { top: 64, right: 12 } : { top: 'calc(100% + 8px)', right: 0 }),
                        zIndex: 10000,
                        width: 230,
                        maxWidth: 'calc(100vw - 24px)',
                        maxHeight: 'calc(100vh - 80px)',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        padding: 12,
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                        color: '#1f2937',
                        fontSize: 12,
                    }}
                >
                    {[
                        ['enabled', 'Enable PWD accessibility'],
                        ['readWhileTyping', 'Read while typing'],
                    ].map(([key, text]) => (
                        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <input
                                type="checkbox"
                                checked={key === 'enabled' ? enabled : readWhileTyping}
                                disabled={key === 'readWhileTyping' && !enabled}
                                onChange={(event) => setSetting(key, event.target.checked)}
                            />
                            <span>{text}</span>
                        </label>
                    ))}
                </div>
            )}

            {speechState !== 'idle' && (
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
        </div>
    );
}
