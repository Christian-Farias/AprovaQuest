import { useEffect, useRef, useState } from 'react'
import type { Attempt, Question } from '@/shared/db/types'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Modal } from '@/shared/ui/Modal'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useToast } from '@/shared/toast/useToast'
import { useQuestionOptions } from '../application/questions.hooks'
import { useQuestionsService } from '../application/useQuestionsService'

export function PracticeModal({
  open,
  onClose,
  question,
}: {
  open: boolean
  onClose: () => void
  question: Question
}) {
  const options = useQuestionOptions(question.id)
  const service = useQuestionsService()
  const toast = useToast()
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Attempt | null>(null)
  const startedAt = useRef<number>(0)

  useEffect(() => {
    if (open) {
      setSelected(null)
      setResult(null)
      startedAt.current = Date.now()
    }
  }, [open, question.id])

  const correctOption = options?.find((o) => o.isCorrect)

  async function handleSubmit() {
    setSubmitting(true)
    const durationMs = Date.now() - startedAt.current
    const response = await service.answerQuestion({
      questionId: question.id,
      selectedOptionId: selected,
      durationMs,
    })
    setSubmitting(false)
    if (response.ok) {
      setResult(response.value)
    } else {
      toast.notify({ tone: 'error', title: 'Não foi possível registrar', description: response.error.message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Responder questão"
      footer={
        result ? (
          <Button onClick={onClose}>Concluir</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Fechar
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Responder
            </Button>
          </>
        )
      }
    >
      <p className="whitespace-pre-wrap text-sm text-mist-100">{question.statement}</p>

      {!options ? (
        <LoadingState label="Carregando alternativas…" />
      ) : (
        <fieldset className="mt-4 space-y-2" disabled={result !== null}>
          <legend className="sr-only">Alternativas</legend>
          {options.map((option) => {
            const isSelected = selected === option.id
            const isCorrectAnswer = result !== null && option.isCorrect
            const isWrongPick = result !== null && isSelected && !option.isCorrect
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  isCorrectAnswer
                    ? 'border-ok-500/60 bg-ok-500/10'
                    : isWrongPick
                      ? 'border-danger-500/60 bg-danger-500/10'
                      : isSelected
                        ? 'border-brand-500 bg-brand-600/10'
                        : 'border-ink-600 hover:border-ink-500'
                }`}
              >
                <input
                  type="radio"
                  name="practice-option"
                  className="mt-0.5 size-4 accent-[var(--color-brand-500)]"
                  checked={isSelected}
                  onChange={() => setSelected(option.id)}
                />
                <span className="font-semibold text-ink-300">{option.label}</span>
                <span className="text-mist-200">{option.text}</span>
              </label>
            )
          })}
        </fieldset>
      )}

      {result ? (
        <div className="mt-4 rounded-lg border border-ink-600 bg-ink-800 p-3">
          <div className="flex items-center gap-2">
            {result.outcome === 'correct' ? (
              <Badge tone="ok">Acertou</Badge>
            ) : result.outcome === 'incorrect' ? (
              <Badge tone="danger">Errou</Badge>
            ) : (
              <Badge tone="warn">Sem resposta</Badge>
            )}
            <span className="text-sm text-ink-300">
              Gabarito: {correctOption ? correctOption.label : 'não confirmado'}
            </span>
          </div>
          {question.explanation ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-mist-200">{question.explanation}</p>
          ) : (
            <p className="mt-2 text-xs text-ink-400">Esta questão não possui comentário cadastrado.</p>
          )}
          <p className="mt-1 text-xs text-ink-400">Tentativa registrada no histórico.</p>
        </div>
      ) : null}
    </Modal>
  )
}
