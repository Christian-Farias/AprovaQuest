import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RouterProvider } from 'react-router';
import { router } from './router';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { ToastProvider } from '@/shared/toast/ToastProvider';
import { Toaster } from '@/shared/toast/Toaster';
export function App() {
    return (_jsx(ErrorBoundary, { children: _jsxs(ToastProvider, { children: [_jsx(RouterProvider, { router: router }), _jsx(Toaster, {})] }) }));
}
