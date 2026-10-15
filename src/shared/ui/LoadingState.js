import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LoadingState({ label = 'Carregando…' }) {
    return (_jsxs("div", { role: "status", className: "flex items-center justify-center gap-3 py-12 text-ink-300", children: [_jsx("span", { "aria-hidden": true, className: "size-5 animate-spin rounded-full border-2 border-ink-500 border-t-accent-400" }), _jsx("span", { className: "text-sm", children: label })] }));
}
export function SkeletonList({ rows = 3 }) {
    return (_jsx("div", { className: "space-y-3", "aria-hidden": true, children: Array.from({ length: rows }).map((_, index) => (_jsx("div", { className: "aq-card h-20 animate-pulse bg-ink-800" }, index))) }));
}
