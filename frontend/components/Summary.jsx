// File: components/Summary.jsx
'use client'

import { Button } from '@/components/ui/button'

// Define the order and labels of the fields to display
const FIELD_DEFINITIONS = [
  { key: 'consent',        label: 'Consent Given',               step: 1 },
  { key: 'types',          label: 'Substance(s)/Behavior(s)',    step: 2 },
  { key: 'duration',       label: 'Duration Struggling',         step: 2 },
  { key: 'audit',          label: 'AUDIT-5 Responses',           step: 3 },
  { key: 'dast',           label: 'DAST-5 Responses',            step: 3 },
  { key: 'iat',            label: 'IAT-5 Responses',             step: 3 },
  { key: 'phq2',           label: 'PHQ-2 Scores',                step: 4 },
  { key: 'gad2',           label: 'GAD-2 Scores',                step: 4 },
  { key: 'sleep',          label: 'Sleep Issues',                step: 4 },
  { key: 'suicidality',    label: 'Self-harm/Suicide Thoughts',  step: 4 },
  { key: 'readiness',      label: 'Readiness (1–10)',            step: 5 },
  { key: 'goals',          label: 'Therapy Goals',               step: 5 },
  { key: 'otherGoal',      label: 'Other Goal Details',          step: 5 },
  { key: 'format',         label: 'Preferred Format',            step: 6 },
  { key: 'availability',   label: 'Availability',                step: 6 },
  { key: 'genderPref',     label: 'Gender Preference',           step: 6 },
  { key: 'languagePref',   label: 'Language Preference',         step: 6 },
  { key: 'specialties',    label: 'Desired Therapist Specialty', step: 6 },
]

export default function Summary({ data, onEdit }) {
  // Helper to format each value
  const formatValue = (key, value) => {
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : '—'
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (value && typeof value === 'object') {
      // e.g. { q1: 2, q2: 1, ... }
      return Object.entries(value)
        .map(([q, ans]) => `${q.toUpperCase()}: ${ans}`)
        .join('; ')
    }
    return value !== undefined && value !== '' ? String(value) : '—'
  }

  return (
    <div className="space-y-4">
      {FIELD_DEFINITIONS.map(({ key, label, step }) => (
        <div key={key} className="flex justify-between items-start">
          <div>
            <p className="font-semibold">{label}</p>
            <p className="text-text-muted">
              {formatValue(key, data[key])}
            </p>
          </div>
          {onEdit && (
            <Button
              variant="link"
              size="sm"
              onClick={() => onEdit(step)}
              className="text-primary"
            >
              Edit
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
