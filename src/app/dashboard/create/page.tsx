'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RaceInfoStep } from '@/components/race/wizard/race-info-step'
import { StagesStep } from '@/components/race/wizard/stages-step'
import type { CreateRaceInput, CreateStageInput } from '@/lib/validators/race'
import type { CreateRiderInput } from '@/lib/validators/rider'

interface WizardData {
  race: CreateRaceInput | null
  stages: CreateStageInput[]
  riders: CreateRiderInput[]
}

const TOTAL_STEPS = 4

const STEP_LABELS: Record<number, string> = {
  1: 'Race Info',
  2: 'Stages',
  3: 'Riders',
  4: 'Review',
}

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-400">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-sm font-semibold text-slate-200">
          {STEP_LABELS[currentStep]}
        </p>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step <= currentStep ? 'bg-blue-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function PlaceholderStep({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-4">
        <span className="text-lg font-bold text-slate-400">{step}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        {STEP_LABELS[step]}
      </h3>
      <p className="text-sm text-slate-500">Coming soon — this step will be implemented next.</p>
    </div>
  )
}

export default function CreateRacePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    race: null,
    stages: [],
    riders: [],
  })

  function handleRaceInfoNext(data: CreateRaceInput) {
    setWizardData((prev) => ({ ...prev, race: data }))
    setCurrentStep(2)
  }

  function handleStagesNext(stages: CreateStageInput[]) {
    setWizardData((prev) => ({ ...prev, stages }))
    setCurrentStep(3)
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white">Create Race</h1>
      </div>

      {/* Wizard Card */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 sm:p-8">
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Back button for steps 2+ */}
        {currentStep > 1 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <RaceInfoStep
            onNext={handleRaceInfoNext}
            initialData={wizardData.race}
          />
        )}
        {currentStep === 2 && wizardData.race && (
          <StagesStep
            onNext={handleStagesNext}
            initialData={wizardData.stages.length > 0 ? wizardData.stages : undefined}
            raceType={wizardData.race.type}
          />
        )}
        {currentStep === 3 && <PlaceholderStep step={3} />}
        {currentStep === 4 && <PlaceholderStep step={4} />}
      </div>
    </div>
  )
}
