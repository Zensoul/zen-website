// File: app/_Components/AssessmentModal.jsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useUser } from '@/context/UserContext'
import AuthModal from '@/components/AuthModal'
import Stepper from './Stepper'
import QuestionCard from './QuestionCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import BookingModal from './BookingModal'

// Standard questionnaires
const AUDIT_QUESTIONS = [
  'How often do you have a drink containing alcohol?',
  'How many drinks do you have on a typical day when you are drinking?',
  'How often do you have six or more drinks on one occasion?',
  'During the past year, how often have you found that you were not able to stop drinking once you had started?',
  'During the past year, how often have you failed to do what was normally expected because of drinking?'
]

const DAST_QUESTIONS = [
  'Have you used drugs other than those required for medical reasons?',
  'Do you abuse more than one drug at a time?',
  'Can you stop using drugs when you want to?',
  'Have you had “blackouts” or flashbacks as a result of drug use?',
  'Do you ever feel bad or guilty about your drug use?',
  'Does your spouse or family ever complain about your involvement with drugs?',
  'Have you neglected your family because of your use of drugs?',
  'Have you engaged in illegal activities in order to obtain drugs?',
  'Have you ever experienced symptoms of withdrawal when you stopped taking drugs?',
  'Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?'
]

const IAT_QUESTIONS = [
  'How often do you stay online longer than intended?',
  'How often neglect household chores to spend more time online?',
  'How often ignore people who are talking to you to spend more time online?',
  'How often prefer to spend time online rather than with others?',
  'How often form new relationships with fellow online users?',
  'How often think about being online when offline?',
  'How often try to cut down the amount of time you spend online and fail?',
  'How often score points to increase your time online?',
  'How often become defensive or secretive when anyone asks you what you do online?',
  'How often feel depressed, moody, or nervous when you are offline and think about online use?'
]

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen'
]

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed — or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way'
]

export default function AssessmentModal({ open, onClose, onBookNow }) {
  const { user, isAuthenticated } = useUser()
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)

  // Steps: 1=Consent, 2=Category, 3=Branch Qs, 4=Review & Submit
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    consent: false,
    category: '',
    // Addiction
    addictionTypes: [],
    addictionDuration: '',
    audit5:    Array(AUDIT_QUESTIONS.length).fill(0),
    dast10:    Array(DAST_QUESTIONS.length).fill(false),
    iat10:     Array(IAT_QUESTIONS.length).fill(0),
    // Anxiety
    anxietyResponses:   Array(GAD7_QUESTIONS.length).fill(0),
    // Depression
    depressionResponses:Array(PHQ9_QUESTIONS.length).fill(0),
    // Teen & Couples
    teenConcern: '',
    couplesConcern: '',
  })

  const [loginOpen, setLoginOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Matching overlay
  const [showMatching, setShowMatching] = useState(false)
  const [matchedCounsellors, setMatchedCounsellors] = useState([])

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev'

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1)
      setError('')
      setShowMatching(false)
      setMatchedCounsellors([])
      setData({
        consent: false,
        category: '',
        addictionTypes: [],
        addictionDuration: '',
        audit5:    Array(AUDIT_QUESTIONS.length).fill(0),
        dast10:    Array(DAST_QUESTIONS.length).fill(false),
        iat10:     Array(IAT_QUESTIONS.length).fill(0),
        anxietyResponses:   Array(GAD7_QUESTIONS.length).fill(0),
        depressionResponses:Array(PHQ9_QUESTIONS.length).fill(0),
        teenConcern: '',
        couplesConcern: '',
      })
    }
  }, [open])

  const update = (field, value) =>
    setData(prev => ({ ...prev, [field]: value }))

  const next = () => setStep(s => Math.min(s + 1, 4))
  const back = () => setStep(s => Math.max(s - 1, 1))


  // Submit & matching
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (!isAuthenticated) {
        setLoginOpen(true)
        return
      }
      const userId = user.userId || user.sub
      if (!userId) throw new Error('Unable to identify user.')

      console.log('[AssessmentModal] Submitting with category:', data.category);  
      const res = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      })
      if (!res.ok) throw new Error(await res.text())

      setShowMatching(true)
      setTimeout(async () => {
        try {
          const cRes = await fetch(
      `${API_BASE}/counsellors?category=${encodeURIComponent(data.category)}`
    )
          const { counsellors } = await cRes.json()
          console.log('[AssessmentModal] Matched counsellors:', counsellors);
          setMatchedCounsellors(counsellors.slice(0, 5))
        } catch (err) {
          console.error(err)
        }
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Matching modal
  if (showMatching) {
    return (
      <Dialog open onClose={() => { setShowMatching(false); onClose() }} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            {!matchedCounsellors.length ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin h-14 w-14 border-4 border-gray-300 border-t-[#c9a96a] rounded-full" />
                <p className="mt-4 text-xl font-semibold text-gray-700">Matching Your Therapist…</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Recommended Therapists</h2>
                <ul className="space-y-4 max-h-80 overflow-y-auto">
                  {matchedCounsellors.map(c => (
                    <li key={c.id} className="border border-gray-200 p-5 rounded-2xl shadow-lg">
                      <p className="font-semibold text-gray-800 text-lg">{c.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{c.specialization}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Sub-specializations:</span> {Array.isArray(c.subSpecializations) ? c.subSpecializations.join(', ') : c.subSpecializations}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Experience:</span> {c.experienceYears} years
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Languages:</span> {Array.isArray(c.languages) ? c.languages.join(', ') : c.languages}
                        </p>
                      <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Fee:</span> ₹{c.feePerSessionINR}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{c.bio}</p>
                      {/* --- Book Now Button --- */}
                      <div className="mt-4 text-right">
                      <Button
                      className="bg-[#23785d] text-white hover:bg-[#19634b] px-5 py-2 rounded-full"
                      
                      onClick={() => {
                      setShowMatching(false);      // <-- [THIS LINE IS NEEDED!]
                      onBookNow?.(c)                   // CHANGE: tell parent to close Assessment & open Booking
                      }}
                      >
                      Book Now
                      </Button>
      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 text-right">
                  <Button
                    className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                    onClick={() => { setShowMatching(false); onClose() }}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    )
  }

  // Premium summary UI
  const renderSummary = () => (
    <QuestionCard className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl">
      <h3 className="text-2xl font-bold text-gray-800 mb-8">Review Your Assessment</h3>
      <div className="space-y-6">
        <div className="flex justify-between">
          <span className="text-gray-600 font-medium">Category</span>
          <span className="text-gray-900 font-semibold">{data.category}</span>
        </div>
        {data.category === 'Addiction' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Substances/Behaviors</span>
              <span className="text-gray-900 font-semibold">{data.addictionTypes.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Duration</span>
              <span className="text-gray-900 font-semibold">{data.addictionDuration} months</span>
            </div>
            {data.addictionTypes.includes('Alcohol') && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700">AUDIT-5 Scores</h4>
                <ul className="list-decimal list-inside text-gray-900 text-sm mt-2 space-y-1">
                  {AUDIT_QUESTIONS.map((q,i) => (
                    <li key={i}>{q}: <span className="font-semibold">{data.audit5[i]}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {data.addictionTypes.some(t => t !== 'Alcohol' && t !== 'Internet') && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700">DAST-10 Responses</h4>
                <ul className="text-gray-900 text-sm mt-2 space-y-1">
                  {DAST_QUESTIONS.map((q,i) => (
                    <li key={i}><input type="checkbox" checked={data.dast10[i]} readOnly className="mr-2" />{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.addictionTypes.includes('Internet') && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700">IAT-10 Scores</h4>
                <ul className="list-decimal list-inside text-gray-900 text-sm mt-2 space-y-1">
                  {IAT_QUESTIONS.map((q,i) => (
                    <li key={i}>{q}: <span className="font-semibold">{data.iat10[i]}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {data.category === 'Anxiety' && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700">GAD-7 Scores</h4>
            <ul className="list-decimal list-inside text-gray-900 text-sm mt-2 space-y-1">
              {GAD7_QUESTIONS.map((q,i) => (
                <li key={i}>{q}: <span className="font-semibold">{data.anxietyResponses[i]}</span></li>
              ))}
            </ul>
          </div>
        )}
        {data.category === 'Depression' && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700">PHQ-9 Scores</h4>
            <ul className="list-decimal list-inside text-gray-900 text-sm mt-2 space-y-1">
              {PHQ9_QUESTIONS.map((q,i) => (
                <li key={i}>{q}: <span className="font-semibold">{data.depressionResponses[i]}</span></li>
              ))}
            </ul>
          </div>
        )}
        {data.category === 'Teen Therapy' && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700">Your Concern</h4>
            <p className="text-gray-900 mt-1">{data.teenConcern}</p>
          </div>
        )}
        {data.category === 'Couples Therapy' && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700">Focus Area</h4>
            <p className="text-gray-900 mt-1">{data.couplesConcern}</p>
          </div>
        )}
      </div>
    </QuestionCard>
  )

  // Main per-step render
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
            <Checkbox
              id="consent"
              checked={data.consent}
              onCheckedChange={chk => update('consent', chk)}
            />
            <Label htmlFor="consent" className="ml-3 text-gray-700">
              I consent to share this information *
            </Label>
          </QuestionCard>
        )

      case 2:
        return (
          <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
            <Label className="mb-4 text-gray-700 font-medium text-lg">Choose a therapy category *</Label>
            <RadioGroup
              value={data.category}
              onValueChange={val => update('category', val)}
              className="space-y-3"
            >
              {[
                'Addiction',
                'Anxiety',
                'Depression',
                'Teen Therapy',
                'Couples Therapy'
              ].map(cat => (
                <div key={cat} className="flex items-center">
                  <RadioGroupItem
                    value={cat}
                    id={cat}
                    className="h-5 w-5 border-gray-300 text-[#c9a96a] focus:ring-[#c9a96a]"
                  />
                  <Label htmlFor={cat} className="ml-3 text-gray-800">{cat}</Label>
                </div>
              ))}
            </RadioGroup>
          </QuestionCard>
        )

      case 3:
        switch (data.category) {
          case 'Addiction':
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg space-y-6">
                <div>
                  <Label className="block text-gray-700 mb-2 font-medium">Substance(s)/Behavior(s)? *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Alcohol','Opioids','Gambling','Internet','Other'].map(opt => (
                      <label key={opt} className="inline-flex items-center">
                        <Checkbox
                          id={opt}
                          checked={data.addictionTypes.includes(opt)}
                          onCheckedChange={chk => {
                            const arr = chk
                              ? [...data.addictionTypes, opt]
                              : data.addictionTypes.filter(x => x !== opt)
                            update('addictionTypes', arr)
                          }}
                        />
                        <span className="ml-2 text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="block text-gray-700 mb-2 font-medium">Duration (months)</Label>
                  <Slider
                    min={0} max={12}
                    value={[Number(data.addictionDuration) || 0]}
                    onValueChange={([v]) => update('addictionDuration', v)}
                    className="mt-2"
                  />
                  <p className="mt-1 text-gray-600 text-sm">{data.addictionDuration} months</p>
                </div>

                {data.addictionTypes.includes('Alcohol') && (
                  <div>
                    <h4 className="text-gray-800 font-medium mb-2">AUDIT-5</h4>
                    <div className="space-y-3">
                      {AUDIT_QUESTIONS.map((q,i) => (
                        <div key={i}>
                          <Label className="text-gray-700 text-sm">{q}</Label>
                          <Slider
                            min={0} max={4}
                            value={[data.audit5[i]]}
                            onValueChange={([v]) => {
                              const arr = [...data.audit5]; arr[i]=v
                              update('audit5', arr)
                            }}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.addictionTypes.some(t => t !== 'Alcohol' && t !== 'Internet') && (
                  <div>
                    <h4 className="text-gray-800 font-medium mb-2">DAST-10</h4>
                    <div className="space-y-2">
                      {DAST_QUESTIONS.map((q,i) => (
                        <label key={i} className="inline-flex items-start">
                          <Checkbox
                            id={`dast-${i}`}
                            checked={data.dast10[i]}
                            onCheckedChange={chk => {
                              const arr = [...data.dast10]; arr[i]=chk
                              update('dast10', arr)
                            }}
                          />
                          <span className="ml-2 text-gray-700 text-sm">{q}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {data.addictionTypes.includes('Internet') && (
                  <div>
                    <h4 className="text-gray-800 font-medium mb-2">IAT-10</h4>
                    <div className="space-y-3">
                      {IAT_QUESTIONS.map((q,i) => (
                        <div key={i}>
                          <Label className="text-gray-700 text-sm">{q}</Label>
                          <Slider
                            min={0} max={5}
                            value={[data.iat10[i]]}
                            onValueChange={([v]) => {
                              const arr = [...data.iat10]; arr[i]=v
                              update('iat10', arr)
                            }}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </QuestionCard>
            )

          case 'Anxiety':
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
                <h4 className="text-gray-800 font-medium mb-3">GAD-7</h4>
                <div className="space-y-4">
                  {GAD7_QUESTIONS.map((q,i) => (
                    <div key={i}>
                      <Label className="text-gray-700 text-sm">{q}</Label>
                      <Slider
                        min={0} max={3}
                        value={[data.anxietyResponses[i]]}
                        onValueChange={([v]) => {
                          const arr = [...data.anxietyResponses]; arr[i]=v
                          update('anxietyResponses', arr)
                        }}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </QuestionCard>
            )

          case 'Depression':
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
                <h4 className="text-gray-800 font-medium mb-3">PHQ-9</h4>
                <div className="space-y-4">
                  {PHQ9_QUESTIONS.map((q,i) => (
                    <div key={i}>
                      <Label className="text-gray-700 text-sm">{q}</Label>
                      <Slider
                        min={0} max={3}
                        value={[data.depressionResponses[i]]}
                        onValueChange={([v]) => {
                          const arr = [...data.depressionResponses]; arr[i]=v
                          update('depressionResponses', arr)
                        }}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </QuestionCard>
            )

          case 'Teen Therapy':
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
                <Label className="text-gray-700 font-medium mb-2">What’s your main concern?</Label>
                <Input
                  value={data.teenConcern}
                  onChange={e => update('teenConcern', e.target.value)}
                  placeholder="Describe your concern"
                  className="mt-1"
                />
              </QuestionCard>
            )

          case 'Couples Therapy':
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
                <Label className="text-gray-700 font-medium mb-2">Focus area?</Label>
                <Input
                  value={data.couplesConcern}
                  onChange={e => update('couplesConcern', e.target.value)}
                  placeholder="Describe focus area"
                  className="mt-1"
                />
              </QuestionCard>
            )

          default:
            return (
              <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg">
                <p className="text-gray-600">Please select a category first.</p>
              </QuestionCard>
            )
        }

      case 4:
        return renderSummary()

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <DialogPanel className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Stepper + Content */}
            <div className="p-6 flex-shrink-0">
              <Stepper step={step} />
            </div>

            <div className="px-6 overflow-y-auto flex-grow">
              {renderStep()}
              {error && <p className="text-red-600 text-center mt-4">{error}</p>}
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center flex-shrink-0 sticky bottom-0">
              <Button
                variant="outline"
                className="text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-full"
                onClick={back}
                disabled={step === 1}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button
                  className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                  onClick={next}
                  disabled={
                    (step === 1 && !data.consent) ||
                    (step === 2 && !data.category)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Submit'}
                </Button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <AuthModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        skipRedirect={true}
      />
      
    </>
  )
}
 