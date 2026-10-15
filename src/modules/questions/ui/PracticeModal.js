import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Modal } from '@/shared/ui/Modal';
import { LoadingState } from '@/shared/ui/LoadingState';
import { useToast } from '@/shared/toast/useToast';
import { useQuestionOptions } from '../application/questions.hooks';
import { useQuestionsService } from '../application/useQuestionsService';
export function PracticeModal({ open, onClose, question, }) {
    const options = useQuestionOptions(question.id);
    const service = useQuestionsService();
    const toast = useToast();
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const startedAt = useRef(0);
    useEffect(() => {
        if (open) {
            setSelected(null);
            setResult(null);
            startedAt.current = Date.now();
        }
    }, [open, question.id]);
    const correctOption = options?.find((o) => o.isCorrect);
    async function handleSubmit() {
        setSubmitting(true);
        const durationMs = Date.now() - startedAt.current;
        const response = await service.answerQuestion({
            questionId: question.id,
            selectedOptionId: selected,
            durationMs,
        });
        setSubmitting(false);
        if (response.ok) {
            setResult(response.value);
        }
        else {
            toast.notify({ tone: 'error', title: 'Não foi possível registrar', description: response.error.message });
        }
    }
    return (_jsxs(Modal, { open: open, onClose: onClose, size: "lg", title: "Responder quest\u00E3o", footer: result ? (_jsx(Button, { onClick: onClose, children: "Concluir" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: "Fechar" }), _jsx(Button, { onClick: handleSubmit, loading: submitting, children: "Responder" })] })), children: [_jsx("p", { className: "whitespace-pre-wrap text-sm text-mist-100", children: question.statement }), !options ? (_jsx(LoadingState, { label: "Carregando alternativas\u2026" })) : (_jsxs("fieldset", { className: "mt-4 space-y-2", disabled: result !== null, children: [_jsx("legend", { className: "sr-only", children: "Alternativas" }), options.map((option) => {
                        const isSelected = selected === option.id;
                        const isCorrectAnswer = result !== null && option.isCorrect;
                        const isWrongPick = result !== null && isSelected && !option.isCorrect;
                        return (_jsxs("label", { className: `flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${isCorrectAnswer
                                ? 'border-ok-500/60 bg-ok-500/10'
                                : isWrongPick
                                    ? 'border-danger-500/60 bg-danger-500/10'
                                    : isSelected
                                        ? 'border-brand-500 bg-brand-600/10'
                                        : 'border-ink-600 hover:border-ink-500'}`, children: [_jsx("input", { type: "radio", name: "practice-option", className: "mt-0.5 size-4 accent-[var(--color-brand-500)]", checked: isSelected, onChange: () => setSelected(option.id) }), _jsx("span", { className: "font-semibold text-ink-300", children: option.label }), _jsx("span", { className: "text-mist-200", children: option.text })] }, option.id));
                    })] })), result ? (_jsxs("div", { className: "mt-4 rounded-lg border border-ink-600 bg-ink-800 p-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [result.outcome === 'correct' ? (_jsx(Badge, { tone: "ok", children: "Acertou" })) : result.outcome === 'incorrect' ? (_jsx(Badge, { tone: "danger", children: "Errou" })) : (_jsx(Badge, { tone: "warn", children: "Sem resposta" })), _jsxs("span", { className: "text-sm text-ink-300", children: ["Gabarito: ", correctOption ? correctOption.label : 'não confirmado'] })] }), question.explanation ? (_jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm text-mist-200", children: question.explanation })) : (_jsx("p", { className: "mt-2 text-xs text-ink-400", children: "Esta quest\u00E3o n\u00E3o possui coment\u00E1rio cadastrado." })), _jsx("p", { className: "mt-1 text-xs text-ink-400", children: "Tentativa registrada no hist\u00F3rico." })] })) : null] }));
}
