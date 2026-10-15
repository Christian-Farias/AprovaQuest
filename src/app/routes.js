/**
 * Registro de rotas tipadas do AprovaQuest.
 * Use `routes.questionDetail(id)` para montar URLs com parâmetros.
 */
export const routes = {
    dashboard: '/',
    questions: '/questoes',
    questionDetail: (id) => `/questoes/${encodeURIComponent(id)}`,
    questionDetailPattern: '/questoes/:id',
    imports: '/importar',
    errors: '/erros',
    schedule: '/cronograma',
    statistics: '/estatisticas',
    backup: '/backup',
};
