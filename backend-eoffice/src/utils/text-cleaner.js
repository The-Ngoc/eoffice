const path = require('path');

function normalizeText(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let text = input
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/-\n([\p{L}])/gu, '$1');

    const lines = text
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim());

    const mergedLines = [];

    for (const line of lines) {
        if (!line) {
            if (mergedLines.length > 0 && mergedLines[mergedLines.length - 1] !== '') {
                mergedLines.push('');
            }
            continue;
        }

        const previousLine = mergedLines[mergedLines.length - 1];
        if (previousLine && shouldJoinLine(previousLine, line)) {
            mergedLines[mergedLines.length - 1] = `${previousLine} ${line}`.replace(/[ \t]+/g, ' ').trim();
            continue;
        }

        mergedLines.push(line);
    }

    return mergedLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function shouldJoinLine(previousLine, currentLine) {
    const bulletPattern = /^([-*•]|\d+[.)]|[a-zA-Z][.)])\s+/;
    const headingPattern = /^(I\.|II\.|III\.|IV\.|V\.|PHẦN|MỤC|CHƯƠNG|ĐIỀU)\b/i;

    if (bulletPattern.test(currentLine)) {
        return false;
    }

    if (headingPattern.test(currentLine)) {
        return false;
    }

    if (/[:.!?;…]$/.test(previousLine)) {
        return false;
    }

    if (previousLine.length > 120) {
        return false;
    }

    return true;
}

function safeFileName(fileName) {
    return path.basename(fileName).replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function truncateText(text, maxLength) {
    if (!text) {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
}

function uniqueValues(values) {
    return Array.from(new Set(values));
}

module.exports = {
    normalizeText,
    safeFileName,
    truncateText,
    uniqueValues
};