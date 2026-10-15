import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function StatCard({ label, value, hint, tone = 'neutral', }) {
    const toneClass = {
        neutral: 'text-mist-100',
        accent: 'text-accent-300',
        danger: 'text-danger-400',
        ok: 'text-ok-400',
        brand: 'text-brand-400',
    }[tone];
    return (_jsxs("div", { className: "aq-card p-4", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-ink-400", children: label }), _jsx("p", { className: cn('mt-1 text-2xl font-semibold tabular-nums', toneClass), children: value }), hint ? _jsx("p", { className: "mt-1 text-xs text-ink-400", children: hint }) : null] }));
}
