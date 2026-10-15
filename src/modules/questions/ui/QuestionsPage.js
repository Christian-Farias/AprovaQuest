import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Field, Select } from '@/shared/ui/Field';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SkeletonList } from '@/shared/ui/LoadingState';
import { useToast } from '@/shared/toast/useToast';
import { useDisciplines, useQuestions } from '../application/questions.hooks';
import { useQuestionsService } from '../application/useQuestionsService';
import { QuestionFormModal } from './QuestionFormModal';
import { PracticeModal } from './PracticeModal';
export function QuestionsPage() {
    const [disciplineId, setDisciplineId] = useState('');
    const [status, setStatus] = useState('active');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState();
    const [practicing, setPracticing] = useState();
    const disciplines = useDisciplines();
    const questions = useQuestions({
        disciplineId: disciplineId || undefined,
        status: status === 'all' ? undefined : status,
    });
    const service = useQuestionsService();
    const toast = useToast();
    const disciplineNames = useMemo(() => new Map((disciplines ?? []).map((d) => [d.id, d.name])), [disciplines]);
    async function handleDelete(question) {
        const confirmed = window.confirm('Excluir esta questão? Questões com tentativas registradas não podem ser excluídas — apenas arquivadas.');
        if (!confirmed)
            return;
        const result = await service.deleteQuestion(question.id);
        if (result.ok) {
            toast.notify({ tone: 'success', title: 'Questão excluída' });
        }
        else {
            toast.notify({ tone: 'error', title: 'Não foi possível excluir', description: result.error.message });
        }
    }
    async function handleToggleArchive(question) {
        const action = question.status === 'archived' ? service.unarchiveQuestion : service.archiveQuestion;
        const result = await action(question.id);
        if (result.ok) {
            toast.notify({
                tone: 'success',
                title: question.status === 'archived' ? 'Questão reativada' : 'Questão arquivada',
            });
        }
        else {
            toast.notify({ tone: 'error', title: 'Falha na operação', description: result.error.message });
        }
    }
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Quest\u00F5es", description: "Seu banco de quest\u00F5es. Todas as tentativas ficam registradas no hist\u00F3rico e nunca s\u00E3o sobrescritas.", action: _jsx(Button, { onClick: () => {
                        setEditing(undefined);
                        setFormOpen(true);
                    }, children: "+ Nova quest\u00E3o" }) }), _jsxs("div", { className: "mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl", children: [_jsx(Field, { label: "Disciplina", children: _jsxs(Select, { value: disciplineId, onChange: (e) => setDisciplineId(e.target.value), children: [_jsx("option", { value: "", children: "Todas" }), (disciplines ?? []).map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] }) }), _jsx(Field, { label: "Situa\u00E7\u00E3o", children: _jsxs(Select, { value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "active", children: "Ativas" }), _jsx("option", { value: "archived", children: "Arquivadas" }), _jsx("option", { value: "all", children: "Todas" })] }) })] }), questions === undefined ? (_jsx(SkeletonList, {})) : questions.length === 0 ? (_jsx(EmptyState, { title: "Nenhuma quest\u00E3o por aqui", description: "Cadastre uma quest\u00E3o manualmente ou importe um PDF na p\u00E1gina \u201CImportar PDFs\u201D. Nada \u00E9 criado automaticamente.", action: _jsx(Button, { onClick: () => {
                        setEditing(undefined);
                        setFormOpen(true);
                    }, children: "Cadastrar quest\u00E3o" }) })) : (_jsx("ul", { className: "space-y-3", children: questions.map((question) => (_jsx("li", { children: _jsxs(Card, { children: [_jsx("div", { className: "flex flex-wrap items-start justify-between gap-3", children: _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2", children: [_jsx(Badge, { tone: "brand", children: question.type === 'true_false' ? 'Certo/Errado' : 'Múltipla escolha' }), _jsx(Badge, { children: disciplineNames.get(question.disciplineId) ?? 'Disciplina removida' }), question.status === 'archived' ? _jsx(Badge, { tone: "warn", children: "Arquivada" }) : null, question.annulled ? _jsx(Badge, { tone: "danger", children: "Anulada" }) : null, !question.answerConfirmed ? (_jsx(Badge, { tone: "warn", children: "Gabarito n\u00E3o confirmado" })) : null] }), _jsx("p", { className: "line-clamp-3 text-sm text-mist-200", children: question.statement })] }) }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx(Button, { size: "sm", disabled: !question.answerConfirmed || question.annulled, onClick: () => setPracticing(question), children: "Responder" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => {
                                            setEditing(question);
                                            setFormOpen(true);
                                        }, children: "Editar" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleToggleArchive(question), children: question.status === 'archived' ? 'Reativar' : 'Arquivar' }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(question), children: "Excluir" })] })] }) }, question.id))) })), _jsx(QuestionFormModal, { open: formOpen, onClose: () => setFormOpen(false), question: editing }), practicing ? (_jsx(PracticeModal, { open: true, onClose: () => setPracticing(undefined), question: practicing })) : null] }));
}
