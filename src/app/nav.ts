import type { ComponentType, SVGProps } from 'react'
import {
  BackupIcon,
  BadgesIcon,
  ConfigIcon,
  DashboardIcon,
  ErrorsIcon,
  ImportIcon,
  MaterialsIcon,
  QuestionsIcon,
  ReviewIcon,
  ScheduleIcon,
  StatsIcon,
  TaxonomyIcon,
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
  { to: routes.reviews, label: 'Revisão Espaçada', icon: ReviewIcon, primary: true },
  { to: routes.disciplines, label: 'Disciplinas', icon: TaxonomyIcon, primary: false },
  { to: routes.materials, label: 'Materiais', icon: MaterialsIcon, primary: false },
  { to: routes.badges, label: 'Badges', icon: BadgesIcon, primary: false },
  { to: routes.schedule, label: 'Cronograma', icon: ScheduleIcon, primary: false },
  { to: routes.statistics, label: 'Estatísticas', icon: StatsIcon, primary: false },
  { to: routes.configurations, label: 'Configurações', icon: ConfigIcon, primary: false },
  { to: routes.backup, label: 'Backup', icon: BackupIcon, primary: false },
]
