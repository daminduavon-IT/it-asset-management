/**
 * Parse a stored date ("2026-03-13" or "2026-03-13T00:00:00.000Z") as a local calendar date.
 * `new Date("2026-03-13")` is UTC midnight, which shows as the previous day west of UTC.
 */
export function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
    value?: string | null,
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
    return parseDate(value)?.toLocaleDateString(undefined, options) ?? '';
}

/** "YYYY-MM-DD" for <input type="date">, or '' when there is no usable date. */
export function toDateInput(value?: string | null): string {
    return value ? value.split('T')[0] : '';
}

export function startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/** Epoch milliseconds for a stored time (Firestore Timestamp, epoch ms or ISO string), or null. */
export function toMillis(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const ms = Date.parse(value);
        return Number.isNaN(ms) ? null : ms;
    }
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'object') {
        if ('toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
        if ('seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
    }
    return null;
}

export function formatDateTime(value: unknown): string {
    const ms = toMillis(value);
    return ms === null ? '-' : new Date(ms).toLocaleString();
}

export function formatLKR(amount?: number | null): string {
    return typeof amount === 'number' && Number.isFinite(amount) ? `LKR ${amount.toLocaleString()}` : 'N/A';
}
