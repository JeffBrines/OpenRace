'use client'

import { useState, KeyboardEvent } from 'react'
import {
  createRaceSchema,
  type CreateRaceInput,
} from '@/lib/validators/race'

const DEFAULT_CATEGORIES = [
  'Expert Men',
  'Expert Women',
  'Sport Men',
  'Sport Women',
]

const RACE_TYPES: { value: CreateRaceInput['type']; label: string }[] = [
  { value: 'enduro', label: 'Enduro' },
  { value: 'dh', label: 'DH' },
  { value: 'xc', label: 'XC' },
]

const RIDER_ID_MODES: {
  value: CreateRaceInput['rider_id_mode']
  label: string
}[] = [
  { value: 'name_only', label: 'Names Only' },
  { value: 'bib_only', label: 'Bibs Only' },
  { value: 'both', label: 'Both' },
]

interface RaceInfoStepProps {
  onNext: (data: CreateRaceInput) => void
  initialData?: CreateRaceInput | null
}

interface FormState {
  name: string
  date: string
  location: string
  type: CreateRaceInput['type']
  categories: string[]
  rider_id_mode: CreateRaceInput['rider_id_mode']
}

interface FieldErrors {
  name?: string
  date?: string
  location?: string
  type?: string
  categories?: string
  rider_id_mode?: string
}

function buildInitialState(initialData?: CreateRaceInput | null): FormState {
  if (initialData) {
    return {
      name: initialData.name,
      date: initialData.date,
      location: initialData.location ?? '',
      type: initialData.type,
      categories: [...initialData.categories],
      rider_id_mode: initialData.rider_id_mode,
    }
  }
  return {
    name: '',
    date: '',
    location: '',
    type: 'enduro',
    categories: [...DEFAULT_CATEGORIES],
    rider_id_mode: 'both',
  }
}

export function RaceInfoStep({ onNext, initialData }: RaceInfoStepProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(initialData),
  )
  const [categoryInput, setCategoryInput] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function addCategory() {
    const trimmed = categoryInput.trim()
    if (!trimmed) return
    if (form.categories.includes(trimmed)) {
      setCategoryInput('')
      return
    }
    setField('categories', [...form.categories, trimmed])
    setCategoryInput('')
    setErrors((prev) => ({ ...prev, categories: undefined }))
  }

  function removeCategory(index: number) {
    setField(
      'categories',
      form.categories.filter((_, i) => i !== index),
    )
  }

  function handleCategoryKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const raw = {
      name: form.name,
      date: form.date,
      type: form.type,
      location: form.location || undefined,
      categories: form.categories,
      rider_id_mode: form.rider_id_mode,
    }

    const result = createRaceSchema.safeParse(raw)

    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    onNext(result.data)
  }

  const toggleButtonBase =
    'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800'
  const toggleSelected = 'border-blue-500 bg-blue-600 text-white'
  const toggleUnselected =
    'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Race Name */}
      <div>
        <label
          htmlFor="race-name"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Race Name <span className="text-red-400">*</span>
        </label>
        <input
          id="race-name"
          type="text"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="e.g. Mt. Lincoln Enduro 2026"
          className={`w-full rounded-lg border px-3.5 py-2.5 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors ${
            errors.name
              ? 'border-red-500'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="race-date"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Race Date <span className="text-red-400">*</span>
        </label>
        <input
          id="race-date"
          type="date"
          value={form.date}
          onChange={(e) => setField('date', e.target.value)}
          className={`w-full rounded-lg border px-3.5 py-2.5 bg-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors [color-scheme:dark] ${
            errors.date
              ? 'border-red-500'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        />
        {errors.date && (
          <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="race-location"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Location{' '}
          <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <input
          id="race-location"
          type="text"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
          placeholder="e.g. Breckenridge, CO"
          className={`w-full rounded-lg border px-3.5 py-2.5 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors ${
            errors.location
              ? 'border-red-500'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        />
        {errors.location && (
          <p className="mt-1.5 text-xs text-red-400">{errors.location}</p>
        )}
      </div>

      {/* Race Type */}
      <div>
        <p className="block text-sm font-medium text-slate-300 mb-2">
          Race Type <span className="text-red-400">*</span>
        </p>
        <div className="flex gap-2">
          {RACE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField('type', value)}
              className={`${toggleButtonBase} ${
                form.type === value ? toggleSelected : toggleUnselected
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="mt-1.5 text-xs text-red-400">{errors.type}</p>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="block text-sm font-medium text-slate-300 mb-2">
          Categories <span className="text-red-400">*</span>
        </p>

        {form.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {form.categories.map((cat, index) => (
              <span
                key={`${cat}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 border border-slate-600 px-3 py-1 text-sm text-slate-200"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(index)}
                  aria-label={`Remove ${cat}`}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={handleCategoryKeyDown}
            placeholder="Type a category and press Enter"
            className={`flex-1 rounded-lg border px-3.5 py-2.5 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors ${
              errors.categories
                ? 'border-red-500'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Add
          </button>
        </div>
        {errors.categories && (
          <p className="mt-1.5 text-xs text-red-400">{errors.categories}</p>
        )}
      </div>

      {/* Rider ID Mode */}
      <div>
        <p className="block text-sm font-medium text-slate-300 mb-2">
          Rider Identification <span className="text-red-400">*</span>
        </p>
        <div className="flex gap-2">
          {RIDER_ID_MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField('rider_id_mode', value)}
              className={`${toggleButtonBase} ${
                form.rider_id_mode === value ? toggleSelected : toggleUnselected
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.rider_id_mode && (
          <p className="mt-1.5 text-xs text-red-400">{errors.rider_id_mode}</p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          Next: Add Stages
        </button>
      </div>
    </form>
  )
}
