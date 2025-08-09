// File: components/Stepper.jsx
'use client'

const labels = [
  'Welcome','Type & Duration','Screening',
  'Symptoms','Motivation','Logistics','Summary'
]

export default function Stepper({ step }) {
  return (
    <div className="flex items-center mb-6">
      {labels.map((label, i) => {
        const index = i + 1
        const full = index < step
        const half = index === step
        return (
          <div key={label} className="flex-1">
            <div className="relative h-1 mb-2 bg-gray-200">
              <div
                className={`h-full bg-primary ${
                  full ? 'w-full' : half ? 'w-1/2' : 'w-0'
                }`}
              />
            </div>
            <p
              className={`text-xs text-center ${
                half ? 'text-primary font-semibold' : 'text-text-muted'
              }`}
            >
              {label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
