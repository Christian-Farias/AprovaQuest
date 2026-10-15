import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { newId } from '@/shared/lib/ids';
import { ToastContext } from './toast-context';
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);
    const notify = useCallback((toast) => {
        const id = newId();
        setToasts((current) => [...current, { ...toast, id }]);
        window.setTimeout(() => dismiss(id), toast.tone === 'error' ? 8000 : 4500);
    }, [dismiss]);
    const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);
    return _jsx(ToastContext.Provider, { value: value, children: children });
}
