import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { Button } from '@/shared/ui/Button';
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        console.error('Erro de interface capturado:', error, info);
    }
    reset = () => this.setState({ error: null });
    render() {
        if (this.state.error) {
            return (_jsxs("div", { className: "mx-auto max-w-lg px-4 py-16 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-danger-400", children: "Ocorreu um erro inesperado" }), _jsx("p", { className: "mt-2 text-sm text-ink-300", children: "Seus dados continuam salvos localmente. Recarregue a p\u00E1gina para tentar novamente." }), _jsx("pre", { className: "mt-4 overflow-x-auto rounded-lg bg-ink-900 p-3 text-left text-xs text-ink-400", children: this.state.error.message }), _jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: this.reset, children: "Tentar novamente" }), _jsx(Button, { onClick: () => window.location.reload(), children: "Recarregar" })] })] }));
        }
        return this.props.children;
    }
}
