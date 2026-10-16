/**
 * Registro de rotas tipadas do AprovaQuest.
 * Use `routes.questionDetail(id)` para montar URLs com parâmetros.
 */
export const routes = {
  dashboard: '/',
  questions: '/questoes',
  questionDetail: (id: string) => `/questoes/${encodeURIComponent(id)}`,
  questionDetailPattern: '/questoes/:id',
  imports: '/importar',
  errors: '/erros',
  reviews: '/revisoes',
  schedule: '/cronograma',
  statistics: '/estatisticas',
  backup: '/backup',
} as const

export type RouteKey = keyof typeof routes
