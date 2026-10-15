import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const fieldBase =
  'w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-mist-100 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none disabled:opacity-60'

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-mist-200">
        {label}
        {required ? <span className="text-danger-400">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-ink-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-danger-400">{error}</span> : null}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(fieldBase, className)} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(fieldBase, 'min-h-24 resize-y', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(fieldBase, 'appearance-none pr-8', className)}>
      {children}
    </select>
  )
}
