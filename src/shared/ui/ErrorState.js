import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button';
export function ErrorState({ title = 'Algo deu errado', description, onRetry, action, }) {
    return (_jsxs("div", { role: "alert", className: "rounded-card border border-danger-500/40 bg-danger-500/10 px-5 py-6 text-center", children: [_jsx("h3", { className: "text-base font-semibold text-danger-400", children: title }), description ? _jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-mist-300", children: description }) : null, onRetry || action ? (_jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [onRetry ? (_jsx(Button, { variant: "secondary", size: "sm", onClick: onRetry, children: "Tentar novamente" })) : null, action] })) : null] }));
}
