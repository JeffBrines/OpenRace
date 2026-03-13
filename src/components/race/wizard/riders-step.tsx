'use client'

import { useState } from 'react'
import { createRiderSchema, type CreateRiderInput } from '@/lib/validators/rider'
import { parseRiderCsv } from '@/lib/utils/csv-import'

type RiderIdMode = 'name_only' | 'bib_only' | 'both'
type ActiveTab = 'manual' | 'csv'

interface RidersStepProps {
  onNext: (riders: CreateRiderInput[]) => void
  initialData?: CreateRiderInput[]
  categories: string[]
  riderIdMode: RiderIdMode
}

interface RiderFormState {
  name: string
  bib: string
  category: string
  gender: string
  age: string
}

interface RiderFormErrors {
  name?: string
  bib?: string
  category?: string
  gender?: string
  age?: string
}

const EMPTY_FORM: RiderFormState = {
  name: '',
  bib: '',
  category: '',
  gender: '',
  age: '',
}

function buildEmptyForm(categories: string[]): RiderFormState {
  return {
    ...EMPTY_FORM,
    category: categories[0] ?? '',
  }
}

function parseRiderForm(form: RiderFormState): {
  data: CreateRiderInput | null
  errors: RiderFormErrors
} {
  const raw = {
    name: form.name,
    bib: form.bib !== '' ? form.bib : undefined,
    category: form.category,
    gender: form.gender,
    age: form.age !== '' ? Number(form.age) : undefined,
  }

  const result = createRiderSchema.safeParse(raw)

  if (!result.success) {
    const errors: RiderFormErrors = {}
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof RiderFormErrors
      if (field && !errors[field]) {
        errors[field] = issue.message
      }
    })
    return { data: null, errors }
  }

  return { data: result.data, errors: {} }
}

function genderLabel(gender: string): string {
  if (gender === 'male') return 'Male'
  if (gender === 'female') return 'Female'
  if (gender === 'non_binary') return 'Non-binary'
  return gender
}

interface RiderTableProps {
  riders: CreateRiderInput[]
  riderIdMode: RiderIdMode
  onRemove: (index: number) => void
}

function RiderTable({ riders, riderIdMode, onRemove }: RiderTableProps) {
  const showBib = riderIdMode === 'bib_only' || riderIdMode === 'both'

  if (riders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 py-8 text-center">
        <p className="text-sm text-slate-500">No riders added yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-700/60 border-b border-slate-700">
            {showBib && (
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-16">
                Bib
              </th>
            )}
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Category</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Gender</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-14">Age</th>
            <th className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {riders.map((rider, index) => (
            <tr
              key={index}
              className={`border-b border-slate-700/50 last:border-0 ${
                index % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/20'
              }`}
            >
              {showBib && (
                <td className="px-3 py-2 text-slate-300 font-mono">{rider.bib ?? '—'}</td>
              )}
              <td className="px-3 py-2 text-slate-200 font-medium">{rider.name}</td>
              <td className="px-3 py-2 text-slate-300">{rider.category}</td>
              <td className="px-3 py-2 text-slate-400">{genderLabel(rider.gender)}</td>
              <td className="px-3 py-2 text-slate-400">{rider.age ?? '—'}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${rider.name}`}
                  className="flex items-center justify-center w-6 h-6 rounded text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ManualEntryTabProps {
  form: RiderFormState
  errors: RiderFormErrors
  categories: string[]
  riderIdMode: RiderIdMode
  onFieldChange: (field: keyof RiderFormState, value: string) => void
  onAdd: () => void
}

function ManualEntryTab({
  form,
  errors,
  categories,
  riderIdMode,
  onFieldChange,
  onAdd,
}: ManualEntryTabProps) {
  const showBib = riderIdMode === 'bib_only' || riderIdMode === 'both'
  const showName = riderIdMode === 'name_only' || riderIdMode === 'both'

  const inputBase =
    'w-full rounded-lg border px-3 py-2 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors'
  const inputError = 'border-red-500'
  const inputNormal = 'border-slate-600 hover:border-slate-500'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        {showName && (
          <div>
            <label
              htmlFor="rider-name"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="rider-name"
              type="text"
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="e.g. Jeff Brines"
              className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
        )}

        {/* Bib */}
        {showBib && (
          <div>
            <label
              htmlFor="rider-bib"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Bib {riderIdMode === 'bib_only' && <span className="text-red-400">*</span>}
              {riderIdMode === 'both' && (
                <span className="text-slate-500 font-normal">(optional)</span>
              )}
            </label>
            <input
              id="rider-bib"
              type="text"
              value={form.bib}
              onChange={(e) => onFieldChange('bib', e.target.value)}
              placeholder="e.g. 42"
              className={`${inputBase} ${errors.bib ? inputError : inputNormal}`}
            />
            {errors.bib && <p className="mt-1 text-xs text-red-400">{errors.bib}</p>}
          </div>
        )}

        {/* Category */}
        <div>
          <label
            htmlFor="rider-category"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="rider-category"
            value={form.category}
            onChange={(e) => onFieldChange('category', e.target.value)}
            className={`${inputBase} ${errors.category ? inputError : inputNormal}`}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
        </div>

        {/* Gender */}
        <div>
          <label
            htmlFor="rider-gender"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Gender <span className="text-red-400">*</span>
          </label>
          <select
            id="rider-gender"
            value={form.gender}
            onChange={(e) => onFieldChange('gender', e.target.value)}
            className={`${inputBase} ${errors.gender ? inputError : inputNormal}`}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
          </select>
          {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender}</p>}
        </div>

        {/* Age */}
        <div>
          <label
            htmlFor="rider-age"
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            Age <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <input
            id="rider-age"
            type="number"
            min="0"
            max="150"
            value={form.age}
            onChange={(e) => onFieldChange('age', e.target.value)}
            placeholder="e.g. 35"
            className={`${inputBase} ${errors.age ? inputError : inputNormal}`}
          />
          {errors.age && <p className="mt-1 text-xs text-red-400">{errors.age}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
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
        Add Rider
      </button>
    </div>
  )
}

interface CsvImportTabProps {
  categories: string[]
  onImport: (riders: CreateRiderInput[]) => void
}

function CsvImportTab({ categories, onImport }: CsvImportTabProps) {
  const [csvText, setCsvText] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<CreateRiderInput[] | null>(null)

  const exampleCategories = categories.slice(0, 2).join(', ') || 'Expert Men, Sport Women'

  function handleParse() {
    if (!csvText.trim()) {
      setParseErrors(['Please paste CSV content before parsing.'])
      setPreview(null)
      return
    }

    const result = parseRiderCsv(csvText)
    setParseErrors(result.errors)

    if (result.riders.length > 0) {
      setPreview(result.riders)
    } else {
      setPreview(null)
    }
  }

  function handleConfirm() {
    if (!preview) return
    onImport(preview)
    setCsvText('')
    setParseErrors([])
    setPreview(null)
  }

  function handleClear() {
    setCsvText('')
    setParseErrors([])
    setPreview(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-400 mb-2">
          Paste CSV with headers:{' '}
          <code className="bg-slate-700 text-slate-200 px-1 py-0.5 rounded text-xs">
            name, bib, category, gender, age
          </code>
          . The <code className="bg-slate-700 text-slate-200 px-1 py-0.5 rounded text-xs">bib</code>{' '}
          and{' '}
          <code className="bg-slate-700 text-slate-200 px-1 py-0.5 rounded text-xs">age</code>{' '}
          columns are optional.
        </p>
        <p className="text-xs text-slate-500 mb-3">
          Example category values for this race: {exampleCategories}
        </p>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={`name,category,gender,age\nJeff Brines,${categories[0] ?? 'Expert Men'},male,35\nSarah Smith,${categories[1] ?? 'Expert Women'},female,28`}
          rows={8}
          className="w-full rounded-lg border border-slate-600 hover:border-slate-500 px-3 py-2 bg-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors resize-y"
        />
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-3">
          <p className="text-xs font-medium text-red-400 mb-1.5">
            {parseErrors.length} {parseErrors.length === 1 ? 'error' : 'errors'} found:
          </p>
          <ul className="space-y-0.5">
            {parseErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-400">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview !== null && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-900/10 p-3">
          <p className="text-xs font-medium text-blue-300 mb-2">
            Preview — {preview.length} {preview.length === 1 ? 'rider' : 'riders'} ready to import
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left pb-1.5 font-medium text-blue-400 pr-3">Name</th>
                  <th className="text-left pb-1.5 font-medium text-blue-400 pr-3">Category</th>
                  <th className="text-left pb-1.5 font-medium text-blue-400 pr-3">Gender</th>
                  <th className="text-left pb-1.5 font-medium text-blue-400">Age</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((rider, i) => (
                  <tr key={i} className="border-b border-blue-500/10 last:border-0">
                    <td className="py-1 text-slate-300 pr-3">{rider.name}</td>
                    <td className="py-1 text-slate-400 pr-3">{rider.category}</td>
                    <td className="py-1 text-slate-400 pr-3">{genderLabel(rider.gender)}</td>
                    <td className="py-1 text-slate-400">{rider.age ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 5 && (
              <p className="mt-1.5 text-xs text-slate-500">
                ...and {preview.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleParse}
          className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors"
        >
          Parse CSV
        </button>
        {preview !== null && (
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Add {preview.length} {preview.length === 1 ? 'Rider' : 'Riders'}
          </button>
        )}
        {(csvText || preview !== null || parseErrors.length > 0) && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export function RidersStep({
  onNext,
  initialData,
  categories,
  riderIdMode,
}: RidersStepProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('manual')
  const [riders, setRiders] = useState<CreateRiderInput[]>(initialData ?? [])
  const [manualForm, setManualForm] = useState<RiderFormState>(() =>
    buildEmptyForm(categories),
  )
  const [manualErrors, setManualErrors] = useState<RiderFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleFieldChange(field: keyof RiderFormState, value: string) {
    setManualForm((prev) => ({ ...prev, [field]: value }))
    setManualErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleAddRider() {
    const { data, errors } = parseRiderForm(manualForm)

    if (!data) {
      setManualErrors(errors)
      return
    }

    setRiders((prev) => [...prev, data])
    setManualForm(buildEmptyForm(categories))
    setManualErrors({})
  }

  function handleRemoveRider(index: number) {
    setRiders((prev) => prev.filter((_, i) => i !== index))
  }

  function handleCsvImport(imported: CreateRiderInput[]) {
    setRiders((prev) => [...prev, ...imported])
    setActiveTab('manual')
  }

  function handleNext() {
    if (riders.length === 0) {
      setSubmitError('Add at least one rider before continuing.')
      return
    }
    setSubmitError(null)
    onNext(riders)
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'manual', label: 'Manual Entry' },
    { id: 'csv', label: 'CSV Import' },
  ]

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-base font-semibold text-slate-200">Add Riders</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Add riders manually or import from a CSV file.
        </p>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-slate-700 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'manual' && (
          <ManualEntryTab
            form={manualForm}
            errors={manualErrors}
            categories={categories}
            riderIdMode={riderIdMode}
            onFieldChange={handleFieldChange}
            onAdd={handleAddRider}
          />
        )}

        {activeTab === 'csv' && (
          <CsvImportTab categories={categories} onImport={handleCsvImport} />
        )}
      </div>

      {/* Rider list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-300">
            Riders ({riders.length})
          </h3>
        </div>
        <RiderTable
          riders={riders}
          riderIdMode={riderIdMode}
          onRemove={handleRemoveRider}
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <p className="text-sm text-red-400">{submitError}</p>
      )}

      {/* Next button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Review
        </button>
      </div>
    </div>
  )
}
