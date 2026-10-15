import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function EmptyState({ title, description, icon, action, className, }) {
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center rounded-card border border-dashed border-ink-600 bg-ink-850/60 px-6 py-12 text-center', className), children: [icon ? _jsx("div", { className: "mb-3 text-3xl text-ink-400", children: icon }) : null, _jsx("h3", { className: "text-base font-semibold text-mist-100", children: title }), description ? _jsx("p", { className: "mt-1 max-w-md text-sm text-ink-300", children: description }) : null, action ? _jsx("div", { className: "mt-4", children: action }) : null] }));
}
