import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App';
import { registerSW } from 'virtual:pwa-register';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
// Registro do service worker com prompt de atualização (não apaga o IndexedDB).
registerSW({
    immediate: false,
    onNeedRefresh() {
        const shouldReload = window.confirm('Uma nova versão do AprovaQuest está disponível. Atualizar agora? Seus dados locais serão preservados.');
        if (shouldReload) {
            window.location.reload();
        }
    },
});
