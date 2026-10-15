import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function Card({ className, children, ...rest }) {
    return (_jsx("div", { ...rest, className: cn('aq-card p-4 shadow-sm', className), children: children }));
}
export function CardHeader({ title, description, action, }) {
    return (_jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-mist-100", children: title }), description ? _jsx("p", { className: "mt-0.5 text-sm text-ink-300", children: description }) : null] }), action] }));
}
