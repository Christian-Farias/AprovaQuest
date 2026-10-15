import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
const variants = {
    primary: 'bg-accent-500 text-ink-950 hover:bg-accent-400 active:bg-accent-600 disabled:bg-ink-600 disabled:text-ink-400',
    secondary: 'bg-ink-750 text-mist-200 border border-ink-600 hover:bg-ink-700 disabled:text-ink-400',
    ghost: 'bg-transparent text-mist-300 hover:bg-ink-750 disabled:text-ink-500',
    danger: 'bg-danger-500 text-white hover:bg-danger-400 disabled:bg-ink-600',
};
const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};
export function Button({ variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, ...rest }) {
    return (_jsxs("button", { ...rest, disabled: disabled || loading, className: cn('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed', variants[variant], sizes[size], className), children: [loading ? (_jsx("span", { "aria-hidden": true, className: "size-4 animate-spin rounded-full border-2 border-current border-t-transparent" })) : (icon), children] }));
}
