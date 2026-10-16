import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Destrava eventuais service workers que possam ter ficado em espera (waiting) de versões anteriores
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }
  })
}

// Registro com auto-atualização silenciosa (preserva IndexedDB)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Ativa imediatamente o novo worker e recarrega para a nova versão
    updateSW(true)
  },
})
