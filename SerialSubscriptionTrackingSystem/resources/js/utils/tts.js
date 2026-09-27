const pronunciationDictionary = {
    TPU: 'T P U',
    GSPS: 'G S P S',
    DOST: 'D O S T',
    STII: 'S T I I',
};

export const normalizeSpeechText = (value = '') => {
    let text = (value || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\r?\n+/g, '. ')
        .replace(/₱\s?([\d,]+)(?:\.(\d{2}))?/g, (_, pesos, centavos) => `${pesos} pesos${centavos ? ` and ${centavos} centavos` : ''}`)
        .replace(/\bPHP\s?([\d,]+)(?:\.(\d{2}))?/gi, (_, pesos, centavos) => `${pesos} pesos${centavos ? ` and ${centavos} centavos` : ''}`)
        .replace(/\b(\d+(?:\.\d+)?)%/g, '$1 percent')
        .replace(/\bN\/A\b/gi, 'Not available')
        .replace(/\bID\s*:\s*/gi, 'ID number ')
        .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$2/$3/$1');

    Object.entries(pronunciationDictionary).forEach(([term, spoken]) => {
        text = text.replace(new RegExp(`\\b${term}\\b`, 'g'), spoken);
    });

    return text.replace(/\s+/g, ' ').trim();
};

const isHidden = (element) => {
    if (!element || !document.body.contains(element)) {
        return true;
    }

    if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
        return true;
    }

    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
};

const shouldSkipElement = (element) => {
    if (!element || isHidden(element)) {
        return true;
    }

    if (element.closest('[data-tts-ignore="true"], nav, [role="navigation"], header, footer')) {
        return true;
    }

    const tagName = element.tagName && element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        const inputType = (element.type || '').toLowerCase();
        if (inputType === 'password' || inputType === 'hidden') {
            return true;
        }
    }

    if (element.matches('[type="password"], [name*="password" i], [name*="token" i], [name*="api" i], [name*="secret" i]')) {
        return true;
    }

    return false;
};

const readableText = (node) => normalizeSpeechText(node?.innerText || node?.textContent || '');

const collectTextFromNode = (node) => {
    if (!node || shouldSkipElement(node)) {
        return '';
    }

    if (node.nodeType === Node.TEXT_NODE) {
        const text = normalizeSpeechText(node.textContent || '');
        return text ? `${text}. ` : '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const tagName = node.tagName.toLowerCase();
    if (tagName === 'button' || tagName === 'a' || tagName === 'label') {
        return `${readableText(node)}. `;
    }

    let text = '';
    for (const child of node.childNodes) {
        text += collectTextFromNode(child);
    }

    return text;
};

const getTableHeaders = (table) => Array.from(table.querySelectorAll('thead th, tr:first-child th')).map((cell) => readableText(cell));

const getCellHeader = (cell, table) => {
    const columnIndex = cell.cellIndex;
    const headers = getTableHeaders(table);
    const rowHeader = cell.parentElement?.querySelector('th[scope="row"]');
    return readableText(rowHeader) || headers[columnIndex] || `Column ${columnIndex + 1}`;
};

export const getTableRowSpeech = (row) => {
    const table = row?.closest('table');
    if (!table || !row) return '';

    const parts = Array.from(row.cells).map((cell) => {
        const value = readableText(cell);
        return value ? `${getCellHeader(cell, table)}: ${value}` : '';
    }).filter(Boolean);

    return parts.join('. ') + (parts.length ? '.' : '');
};

export const getTableCellSpeech = (cell) => {
    if (!cell) return '';
    const value = readableText(cell);
    return value ? `${getCellHeader(cell, cell.closest('table'))}: ${value}.` : '';
};

export const getTableSpeech = (table) => {
    if (!table) return '';
    const caption = readableText(table.querySelector('caption'));
    const rows = Array.from(table.querySelectorAll('tbody tr, :scope > tr')).map(getTableRowSpeech).filter(Boolean);
    const title = caption ? `Table: ${caption}. ` : 'Table. ';
    return title + rows.join(' ');
};

const getLabelForField = (field) => {
    if (!field) return '';
    const label = field.id && document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    return readableText(label) || readableText(field.closest('label')) || field.getAttribute('aria-label') || field.name || 'Field';
};

export const getFieldSpeech = (field) => {
    if (!field || shouldSkipElement(field)) return '';
    if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked ? normalizeSpeechText(field.value || 'Selected') : '';
    }

    return normalizeSpeechText(field.value || '');
};

export const getFormSpeech = (form) => {
    if (!form) return '';
    const title = readableText(form.querySelector('h1, h2, h3, legend'));
    const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(getFieldSpeech).filter(Boolean);
    return [title, ...fields].filter(Boolean).join(' ');
};

export const getModalSpeech = (modal) => {
    if (!modal) return '';
    const role = modal.getAttribute('role') === 'alertdialog' ? 'Alert dialog.' : 'Dialog.';
    const title = readableText(modal.querySelector('[role="heading"], h1, h2, h3, [data-tts-title]'));
    const content = readableText(modal.querySelector('[data-tts-content]')) || readableText(modal);
    const actions = Array.from(modal.querySelectorAll('button')).map(readableText).filter(Boolean);
    return [role, title, content, actions.length ? `Available actions: ${actions.join('. ')}.` : ''].filter(Boolean).join(' ');
};

export const getSelectionContext = (selection) => {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    const element = node?.closest?.('td, th, tr, table, input, textarea, select, form, [role="dialog"], [role="alertdialog"], [data-tts-context="chat"], [role="alert"], [aria-live]');
    if (!element || shouldSkipElement(element)) return { type: 'text', text: normalizeSpeechText(selection.toString()) };
    const selectedText = normalizeSpeechText(selection.toString());
    if (element.matches('td, th')) return { type: 'table-cell', element, text: getTableRowSpeech(element.parentElement) };
    if (element.matches('tr')) return { type: 'table-row', element, text: getTableRowSpeech(element) };
    if (element.matches('table')) return { type: 'table', element, text: selectedText };
    if (element.matches('input, textarea, select')) return { type: 'field', element, text: selectedText };
    if (element.matches('form')) return { type: 'form', element, text: selectedText };
    if (element.matches('[role="dialog"], [role="alertdialog"]')) return { type: 'modal', element, text: selectedText };
    if (element.matches('[data-tts-context="chat"]')) return { type: 'message', element, text: selectedText };
    if (element.matches('[role="alert"], [aria-live]')) return { type: 'notification', element, text: selectedText };
    return { type: 'text', element, text: selectedText };
};

const extractChartSummary = (chartNode) => {
    const summary = chartNode?.dataset?.ttsSummary || chartNode?.getAttribute('data-tts-summary');
    if (summary) {
        return summary;
    }

    const labels = Array.from(chartNode.querySelectorAll('text')).map((node) => normalizeSpeechText(node.textContent || '')).filter(Boolean);
    if (labels.length) {
        return `Chart summary. ${labels.slice(0, 12).join('. ')}.`;
    }

    return '';
};

export function getReadableTtsContent(root = document) {
    const activeCandidate = root.querySelector('[data-tts-active="true"], [aria-current="true"], [role="dialog"], [data-tts-context="modal"], [data-tts-context="form"], [data-tts-context="table"], [data-tts-context="chart"], [data-tts-context="chat"]');

    const candidateNodes = Array.from(root.querySelectorAll('[data-tts], [role="dialog"], form, table, [data-tts-summary]'))
        .filter((node) => !shouldSkipElement(node));

    const preferred = activeCandidate || candidateNodes.find((node) => node.matches('[role="dialog"], [data-tts-context="modal"], [data-tts-context="form"], [data-tts-context="table"], [data-tts-context="chart"], [data-tts-context="chat"]')) || candidateNodes[0];

    if (!preferred) {
        const fallbackText = Array.from(root.querySelectorAll('main h1, main h2, main h3, main p, main li, [role="alert"], [aria-live="polite"], [aria-live="assertive"]'))
            .filter((node) => !shouldSkipElement(node))
            .map((node) => normalizeSpeechText(node.textContent || ''))
            .filter(Boolean)
            .slice(0, 25)
            .join('. ');

        return normalizeSpeechText(fallbackText) || 'No readable content is available right now.';
    }

    if (preferred.matches('table')) {
        const tableText = getTableSpeech(preferred);
        if (tableText) {
            return tableText;
        }
    }

    if (preferred.matches('[data-tts-summary]') || preferred.dataset?.ttsSummary) {
        return normalizeSpeechText(preferred.dataset?.ttsSummary || preferred.getAttribute('data-tts-summary') || '');
    }

    if (preferred.matches('[data-tts-context="chart"]')) {
        const chartText = extractChartSummary(preferred);
        if (chartText) {
            return chartText;
        }
    }

    const text = collectTextFromNode(preferred);
    const cleaned = normalizeSpeechText(text.replace(/\s*\.[\s.]+/g, '. '));
    return cleaned || 'No readable content is available right now.';
}

export function speakTtsText(text, options = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return { supported: false, message: 'Speech synthesis is not supported in this browser.' };
    }

    const cleanText = normalizeSpeechText(text || '');
    if (!cleanText) {
        return { supported: true, message: 'No readable content was found.' };
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume ?? 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return { supported: true, message: 'Speech started.' };
}

export function stopTts() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
    }

    window.speechSynthesis.cancel();
}
