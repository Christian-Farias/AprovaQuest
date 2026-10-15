import type { ComponentType, SVGProps } from 'react'
import {
  BackupIcon,
  DashboardIcon,
  ErrorsIcon,
  ImportIcon,
  QuestionsIcon,
  ScheduleIcon,
  StatsIcon,
} from '@/shared/ui/icons'
import { routes } from './routes'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end?: boolean
  /** Visível na barra inferior do celular. */
  primary?: boolean
}

export const navItems: NavItem[] = [
  { to: routes.dashboard, label: 'Painel', icon: DashboardIcon, end: true, primary: true },
  { to: routes.questions, label: 'Questões', icon: QuestionsIcon, primary: true },
  { to: routes.imports, label: 'Importar PDFs', icon: ImportIcon, primary: true },
  { to: routes.errors, label: 'Caderno de Erros', icon: ErrorsIcon, primary: false },
  { to: routes.schedule, label: 'Cronograma', icon: ScheduleIcon, primary: true },
  { to: routes.statistics, label: 'Estatísticas', icon: StatsIcon, primary: false },
  { to: routes.backup, label: 'Backup', icon: BackupIcon, primary: false },
]
