import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageHeader({ title, description, action, }) {
    return (_jsxs("header", { className: "mb-5 flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold tracking-tight text-mist-100 sm:text-2xl", children: title }), description ? _jsx("p", { className: "mt-1 max-w-2xl text-sm text-ink-300", children: description }) : null] }), action] }));
}
