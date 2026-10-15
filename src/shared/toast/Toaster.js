import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
import { useToast } from './useToast';
const tones = {
    info: 'border-ink-600 bg-ink-800 text-mist-100',
    success: 'border-ok-500/50 bg-ok-500/15 text-ok-400',
    error: 'border-danger-500/50 bg-danger-500/15 text-danger-400',
};
export function Toaster() {
    const { toasts, dismiss } = useToast();
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { "aria-live": "polite", className: "pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:items-end", children: toasts.map((toast) => (_jsx("div", { role: "status", className: cn('pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg', tones[toast.tone]), children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: toast.title }), toast.description ? (_jsx("p", { className: "mt-0.5 text-xs opacity-90", children: toast.description })) : null] }), _jsx("button", { type: "button", onClick: () => dismiss(toast.id), "aria-label": "Fechar aviso", className: "text-xs opacity-70 hover:opacity-100", children: "\u2715" })] }) }, toast.id))) }));
}
