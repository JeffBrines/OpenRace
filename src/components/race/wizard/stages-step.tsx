'use client'

import { useState } from 'react'
import {
  createStageSchema,
  type CreateStageInput,
} from '@/lib/validators/race'

interface StagesStepProps {
  onNext: (stages: CreateStageInput[]) => void
  initialData?: CreateStageInput[]
  raceType: 'enduro' | 'dh' | 'xc'
}

interface StageFormState {
  name: string
  distance: string
  elevation: string
}

interface StageErrors {
  name?: string
  distance?: string
  elevation?: string
}

function buildDefaultStages(
  raceType: 'enduro' | 'dh' | 'xc',
): StageFormState[] {
  if (raceType === 'enduro') {
    return [
      { name: 'Stage 1', distance: '', elevation: '' },
      { name: 'Stage 2', distance: '', elevation: '' },
      { name: 'Stage 3', distance: '', elevation: '' },
    ]
  }
  return [{ name: 'Stage 1', distance: '', elevation: '' }]
}

function stageInputToFormState(stage: CreateStageInput): StageFormState {
  return {
    name: stage.name,
    distance: stage.distance !== undefined ? String(stage.distance) : '',
    elevation: stage.elevation !== undefined ? String(stage.elevation) : '',
  }
}

function buildInitialFormStages(
  raceType: 'enduro' | 'dh' | 'xc',
  initialData?: CreateStageInput[],
): StageFormState[] {
  if (initialData && initialData.length > 0) {
    return initialData
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(stageInputToFormState)
  }
  return buildDefaultStages(raceType)
}

function parseStageForm(
  form: StageFormState,
  index: number,
): { data: CreateStageInput | null; errors: StageErrors } {
  const raw = {
    name: form.name,
    order: index,
    distance: form.distance !== '' ? Number(form.distance) : undefined,
    elevation: form.elevation !== '' ? Number(form.elevation) : undefined,
  }

  const result = createStageSchema.safeParse(raw)

  if (!result.success) {
    const errors: StageErrors = {}
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof StageErrors
      if (field && !errors[field]) {
        errors[field] = issue.message
      }
    })
    return { data: null, errors }
  }

  return { data: result.data, errors: {} }
}

interface StageCardProps {
  index: number
  total: number
  form: StageFormState
  errors: StageErrors
  isEnduro: boolean
  onChange: (index: number, field: keyof StageFormState, value: string) => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function StageCard({
  index,
  total,
  form,
  errors,
  isEnduro,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StageCardProps) {
  const inputBase =
    'w-full rounded-lg border px-3 py-2 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors'
  const inputError = 'border-red-500'
  const inputNormal = 'border-slate-600 hover:border-slate-500'

  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-200">
          Stage {index + 1}
        </span>

        {isEnduro && (
          <div className="flex items-center gap-1">
            {/* Move up */}
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              aria-label="Move stage up"
              className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Move down */}
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={index === total - 1}
              aria-label="Move stage down"
              className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Remove — only shown when total > 2 */}
            {total > 2 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove Stage ${index + 1}`}
                className="flex items-center justify-center w-7 h-7 rounded text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label
            htmlFor={`stage-name-${index}`}
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id={`stage-name-${index}`}
            type="text"
            value={form.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="e.g. Upper Ridge"
            className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Distance */}
          <div>
            <label
              htmlFor={`stage-distance-${index}`}
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Distance (km){' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              id={`stage-distance-${index}`}
              type="number"
              min="0"
              step="0.1"
              value={form.distance}
              onChange={(e) => onChange(index, 'distance', e.target.value)}
              placeholder="e.g. 3.2"
              className={`${inputBase} ${errors.distance ? inputError : inputNormal}`}
            />
            {errors.distance && (
              <p className="mt-1 text-xs text-red-400">{errors.distance}</p>
            )}
          </div>

          {/* Elevation */}
          <div>
            <label
              htmlFor={`stage-elevation-${index}`}
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Elevation (m){' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              id={`stage-elevation-${index}`}
              type="number"
              min="0"
              step="1"
              value={form.elevation}
              onChange={(e) => onChange(index, 'elevation', e.target.value)}
              placeholder="e.g. 450"
              className={`${inputBase} ${errors.elevation ? inputError : inputNormal}`}
            />
            {errors.elevation && (
              <p className="mt-1 text-xs text-red-400">{errors.elevation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StagesStep({ onNext, initialData, raceType }: StagesStepProps) {
  const isEnduro = raceType === 'enduro'

  const [stages, setStages] = useState<StageFormState[]>(() =>
    buildInitialFormStages(raceType, initialData),
  )
  const [stageErrors, setStageErrors] = useState<StageErrors[]>(() =>
    Array.from({ length: buildInitialFormStages(raceType, initialData).length }, () => ({})),
  )

  function handleFieldChange(
    index: number,
    field: keyof StageFormState,
    value: string,
  ) {
    setStages((prev) =>
      prev.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage,
      ),
    )
    setStageErrors((prev) =>
      prev.map((errs, i) =>
        i === index ? { ...errs, [field]: undefined } : errs,
      ),
    )
  }

  function handleAddStage() {
    const nextIndex = stages.length
    setStages((prev) => [
      ...prev,
      { name: `Stage ${nextIndex + 1}`, distance: '', elevation: '' },
    ])
    setStageErrors((prev) => [...prev, {}])
  }

  function handleRemoveStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index))
    setStageErrors((prev) => prev.filter((_, i) => i !== index))
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    setStages((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
    setStageErrors((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  function handleMoveDown(index: number) {
    if (index === stages.length - 1) return
    setStages((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
    setStageErrors((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const parsed = stages.map((form, index) => parseStageForm(form, index))
    const newErrors = parsed.map((r) => r.errors)
    const hasErrors = parsed.some((r) => r.data === null)

    if (hasErrors) {
      setStageErrors(newErrors)
      return
    }

    onNext(parsed.map((r) => r.data as CreateStageInput))
  }

  const raceTypeLabel =
    raceType === 'enduro' ? 'Enduro' : raceType === 'dh' ? 'DH' : 'XC'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Section header */}
      <div className="mb-2">
        <h2 className="text-base font-semibold text-slate-200">
          {isEnduro ? 'Race Stages' : `${raceTypeLabel} Stage`}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isEnduro
            ? 'Add at least 2 stages. Use the arrows to reorder.'
            : 'Edit the stage details below.'}
        </p>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {stages.map((form, index) => (
          <StageCard
            key={index}
            index={index}
            total={stages.length}
            form={form}
            errors={stageErrors[index] ?? {}}
            isEnduro={isEnduro}
            onChange={handleFieldChange}
            onRemove={handleRemoveStage}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
      </div>

      {/* Add Stage button — enduro only */}
      {isEnduro && (
        <button
          type="button"
          onClick={handleAddStage}
          className="flex items-center gap-2 rounded-lg border border-dashed border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-400 hover:border-blue-500 hover:text-blue-300 hover:bg-blue-900/20 transition-colors w-full justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add Stage
        </button>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          Next: Add Riders
        </button>
      </div>
    </form>
  )
}
