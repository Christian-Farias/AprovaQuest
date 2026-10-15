import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
const fieldBase = 'w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-mist-100 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none disabled:opacity-60';
export function Field({ label, hint, error, required, htmlFor, children, }) {
    return (_jsxs("label", { htmlFor: htmlFor, className: "block", children: [_jsxs("span", { className: "mb-1 flex items-center gap-1 text-sm font-medium text-mist-200", children: [label, required ? _jsx("span", { className: "text-danger-400", children: "*" }) : null] }), children, hint && !error ? _jsx("span", { className: "mt-1 block text-xs text-ink-400", children: hint }) : null, error ? _jsx("span", { className: "mt-1 block text-xs text-danger-400", children: error }) : null] }));
}
export function Input({ className, ...rest }) {
    return _jsx("input", { ...rest, className: cn(fieldBase, className) });
}
export function Textarea({ className, ...rest }) {
    return _jsx("textarea", { ...rest, className: cn(fieldBase, 'min-h-24 resize-y', className) });
}
export function Select({ className, children, ...rest }) {
    return (_jsx("select", { ...rest, className: cn(fieldBase, 'appearance-none pr-8', className), children: children }));
}
