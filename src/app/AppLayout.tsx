import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { navItems } from '@/app/nav'
import { cn } from '@/shared/lib/cn'
import { CloseIcon, MenuIcon } from '@/shared/ui/icons'
import { StreakBadge } from '@/shared/ui/StreakBadge'

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent-500 font-bold text-ink-950">
        AQ
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-mist-100">AprovaQuest</p>
        <p className="text-[11px] text-ink-400">estudos para concursos</p>
      </div>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-ink-300 hover:bg-ink-750 hover:text-mist-100',
                )
              }
            >
              <Icon aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const primaryItems = navItems.filter((item) => item.primary).slice(0, 4)

  return (
    <div className="min-h-dvh bg-ink-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-700 bg-ink-850 px-4 py-5 lg:flex">
        <Brand />
        <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Navegação principal">
          <NavLinks />
        </nav>
        <div className="mt-4 space-y-3">
          <StreakBadge />
          <p className="text-[11px] leading-relaxed text-ink-500">
            Dados armazenados apenas neste dispositivo. Faça backups periódicos.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Topbar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700 bg-ink-900/95 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-3">
            <StreakBadge compact />
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-mist-200 hover:bg-ink-750"
            >
              <MenuIcon />
            </button>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink-700 bg-ink-850/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                  isActive ? 'text-accent-300' : 'text-ink-400',
                )
              }
            >
              <Icon aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-400"
        >
          <MenuIcon aria-hidden />
          <span>Mais</span>
        </button>
      </nav>

      {/* Drawer (mobile) */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink-950/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-ink-700 bg-ink-850 px-4 py-5">
            <div className="mb-5 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-mist-200 hover:bg-ink-750"
              >
                <CloseIcon />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
