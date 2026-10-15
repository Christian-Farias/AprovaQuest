import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Field, Input, Select, Textarea } from '@/shared/ui/Field';
import { Modal } from '@/shared/ui/Modal';
import { useToast } from '@/shared/toast/useToast';
import { useDisciplines, useTopics } from '../application/questions.hooks';
import { useTaxonomyService } from '../application/useTaxonomyService';
import { useQuestionsService } from '../application/useQuestionsService';
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
function defaultOptions(type) {
    if (type === 'true_false') {
        return [
            { label: 'C', text: 'Certo', isCorrect: false },
            { label: 'E', text: 'Errado', isCorrect: false },
        ];
    }
    return LETTERS.slice(0, 4).map((label) => ({ label, text: '', isCorrect: false }));
}
export function QuestionFormModal({ open, onClose, question, }) {
    const questionsService = useQuestionsService();
    const taxonomyService = useTaxonomyService();
    const disciplines = useDisciplines();
    const toast = useToast();
    const [form, setForm] = useState(() => ({
        type: 'multiple_choice',
        statement: '',
        disciplineId: '',
        topicId: '',
        source: '',
        explanation: '',
        tags: '',
        options: defaultOptions('multiple_choice'),
    }));
    const [saving, setSaving] = useState(false);
    const topics = useTopics(form.disciplineId || undefined);
    useEffect(() => {
        if (!open)
            return;
        if (question) {
            setForm({
                type: question.type,
                statement: question.statement,
                disciplineId: question.disciplineId,
                topicId: question.topicId ?? '',
                source: question.source ?? '',
                explanation: question.explanation ?? '',
                tags: question.tags.join(', '),
                options: question.type === 'true_false'
                    ? defaultOptions('true_false')
                    : defaultOptions('multiple_choice'),
            });
            void questionsService.getOptions(question.id).then((result) => {
                if (result.ok && result.value.length > 0) {
                    setForm((current) => ({
                        ...current,
                        options: result.value.map((o) => ({
                            id: o.id,
                            label: o.label,
                            text: o.text,
                            isCorrect: o.isCorrect,
                        })),
                    }));
                }
            });
        }
        else {
            setForm({
                type: 'multiple_choice',
                statement: '',
                disciplineId: '',
                topicId: '',
                source: '',
                explanation: '',
                tags: '',
                options: defaultOptions('multiple_choice'),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, question?.id]);
    const answerConfirmed = form.options.some((o) => o.isCorrect);
    const canSubmit = useMemo(() => form.statement.trim().length > 0 && form.disciplineId.length > 0, [form.statement, form.disciplineId]);
    function updateOption(index, patch) {
        setForm((current) => ({
            ...current,
            options: current.options.map((option, i) => (i === index ? { ...option, ...patch } : option)),
        }));
    }
    function markCorrect(index) {
        setForm((current) => ({
            ...current,
            options: current.options.map((option, i) => ({ ...option, isCorrect: i === index })),
        }));
    }
    function changeType(type) {
        setForm((current) => ({ ...current, type, options: defaultOptions(type) }));
    }
    async function quickCreateDiscipline(name) {
        const result = await taxonomyService.createDiscipline({ name });
        if (result.ok) {
            setForm((current) => ({ ...current, disciplineId: result.value.id }));
        }
        else {
            toast.notify({ tone: 'error', title: 'Não foi possível criar a disciplina', description: result.error.message });
        }
    }
    async function handleSubmit() {
        if (!canSubmit)
            return;
        setSaving(true);
        const input = {
            type: form.type,
            statement: form.statement.trim(),
            disciplineId: form.disciplineId,
            topicId: form.topicId || null,
            source: form.source.trim() || null,
            explanation: form.explanation.trim() || null,
            tags: form.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            options: form.options.map((option) => ({
                id: option.id,
                label: option.label,
                text: option.text,
                isCorrect: option.isCorrect,
            })),
            answerConfirmed,
        };
        const result = question
            ? await questionsService.updateQuestion(question.id, input)
            : await questionsService.createQuestion(input);
        setSaving(false);
        if (result.ok) {
            toast.notify({
                tone: 'success',
                title: question ? 'Questão atualizada' : 'Questão criada',
                description: answerConfirmed
                    ? undefined
                    : 'Gabarito não confirmado: ela não poderá ser respondida até a confirmação.',
            });
            onClose();
        }
        else {
            toast.notify({
                tone: 'error',
                title: 'Não foi possível salvar',
                description: result.error.message,
            });
        }
    }
    return (_jsx(Modal, { open: open, onClose: onClose, size: "lg", title: question ? 'Editar questão' : 'Nova questão', description: "Cadastro manual. As quest\u00F5es importadas de PDFs passam pela tela de revis\u00E3o.", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: saving, children: "Cancelar" }), _jsx(Button, { onClick: handleSubmit, loading: saving, disabled: !canSubmit, children: "Salvar" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Tipo", required: true, children: _jsxs(Select, { value: form.type, onChange: (e) => changeType(e.target.value), children: [_jsx("option", { value: "multiple_choice", children: "M\u00FAltipla escolha" }), _jsx("option", { value: "true_false", children: "Certo / Errado" })] }) }), _jsx(Field, { label: "Disciplina", required: true, children: _jsxs(Select, { value: form.disciplineId, onChange: (e) => setForm((c) => ({ ...c, disciplineId: e.target.value, topicId: '' })), children: [_jsx("option", { value: "", children: "Selecione\u2026" }), (disciplines ?? []).map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] }) })] }), disciplines && disciplines.length === 0 ? (_jsx(QuickDiscipline, { onCreate: quickCreateDiscipline })) : null, _jsx(Field, { label: "Assunto", hint: "Opcional", children: _jsxs(Select, { value: form.topicId, onChange: (e) => setForm((c) => ({ ...c, topicId: e.target.value })), disabled: !form.disciplineId, children: [_jsx("option", { value: "", children: "Sem assunto" }), (topics ?? []).map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] }) }), _jsx(Field, { label: "Enunciado", required: true, children: _jsx(Textarea, { value: form.statement, onChange: (e) => setForm((c) => ({ ...c, statement: e.target.value })), placeholder: "Digite o enunciado da quest\u00E3o" }) }), _jsxs("div", { children: [_jsxs("p", { className: "mb-1 text-sm font-medium text-mist-200", children: ["Alternativas ", _jsx("span", { className: "text-danger-400", children: "*" })] }), _jsx("p", { className: "mb-2 text-xs text-ink-400", children: "Marque a alternativa correta para confirmar o gabarito. Sem marca\u00E7\u00E3o, a quest\u00E3o fica como rascunho e n\u00E3o pode ser respondida." }), _jsx("div", { className: "space-y-2", children: form.options.map((option, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "correct-option", checked: option.isCorrect, onChange: () => markCorrect(index), "aria-label": `Marcar alternativa ${option.label} como correta`, className: "size-4 accent-[var(--color-accent-500)]" }), _jsx("span", { className: "w-5 text-sm font-semibold text-ink-300", children: option.label })] }), _jsx(Input, { value: option.text, onChange: (e) => updateOption(index, { text: e.target.value }), placeholder: `Alternativa ${option.label}` }), form.type === 'multiple_choice' && form.options.length > 2 ? (_jsx("button", { type: "button", "aria-label": `Remover alternativa ${option.label}`, onClick: () => setForm((c) => ({
                                            ...c,
                                            options: c.options.filter((_, i) => i !== index),
                                        })), className: "rounded-md px-2 py-1 text-ink-400 hover:bg-ink-750 hover:text-danger-400", children: "\u2715" })) : null] }, index))) }), form.type === 'multiple_choice' && form.options.length < 6 ? (_jsx(Button, { variant: "ghost", size: "sm", className: "mt-2", onClick: () => setForm((c) => ({
                                ...c,
                                options: [
                                    ...c.options,
                                    { label: LETTERS[c.options.length] ?? '?', text: '', isCorrect: false },
                                ],
                            })), children: "+ Adicionar alternativa" })) : null] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(Field, { label: "Fonte / banca", hint: "Opcional", children: _jsx(Input, { value: form.source, onChange: (e) => setForm((c) => ({ ...c, source: e.target.value })), placeholder: "Ex.: CESPE 2024" }) }), _jsx(Field, { label: "Tags", hint: "Separadas por v\u00EDrgula", children: _jsx(Input, { value: form.tags, onChange: (e) => setForm((c) => ({ ...c, tags: e.target.value })) }) })] }), _jsx(Field, { label: "Coment\u00E1rio / explica\u00E7\u00E3o", hint: "Opcional", children: _jsx(Textarea, { value: form.explanation, onChange: (e) => setForm((c) => ({ ...c, explanation: e.target.value })) }) })] }) }));
}
function QuickDiscipline({ onCreate }) {
    const [name, setName] = useState('');
    return (_jsxs("div", { className: "rounded-lg border border-ink-600 bg-ink-800 p-3", children: [_jsx("p", { className: "text-sm text-mist-200", children: "Nenhuma disciplina cadastrada ainda." }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex.: Direito Constitucional" }), _jsx(Button, { variant: "secondary", disabled: name.trim().length === 0, onClick: () => {
                            onCreate(name.trim());
                            setName('');
                        }, children: "Criar" })] })] }));
}
