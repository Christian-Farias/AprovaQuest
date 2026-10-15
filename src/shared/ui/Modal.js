import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
export function Modal({ open, onClose, title, description, children, footer, size = 'md', }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 sm:items-center sm:p-4", children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": title, className: cn('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-ink-700 bg-ink-850 sm:rounded-2xl', widths[size]), children: [_jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-ink-700 px-4 py-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold text-mist-100", children: title }), description ? _jsx("p", { className: "mt-0.5 text-sm text-ink-300", children: description }) : null] }), _jsx("button", { type: "button", onClick: onClose, "aria-label": "Fechar", className: "rounded-md p-1 text-ink-300 hover:bg-ink-750 hover:text-mist-100", children: "\u2715" })] }), _jsx("div", { className: "overflow-y-auto px-4 py-4", children: children }), footer ? (_jsx("div", { className: "flex flex-wrap justify-end gap-2 border-t border-ink-700 px-4 py-3", children: footer })) : null] }) }));
}
