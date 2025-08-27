// app/_Components/QuickAddictionTestModal.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import AuthModal from '@/components/AuthModal';
import BookingModal from './BookingModal';
import QuickConnectModal from './QuickConnectModal';
import Stepper from './Stepper';
import QuestionCard from './QuestionCard';
import { submitAssessment, recommendTherapists } from '@/lib/api';

// --- concise triage sets ---
const AUDIT5 = [
  'How often do you have a drink containing alcohol?',
  'How many drinks do you have on a typical day when you are drinking?',
  'How often do you have six or more drinks on one occasion?',
  'In the past year, how often couldn’t you stop drinking once you started?',
  'In the past year, how often did drinking affect your responsibilities?'
];
const DAST_SHORT = [
  'Used non-medical drugs in the past 12 months?',
  'Felt you should cut down on drugs?',
  'Anyone annoyed you by criticizing your drug use?'
];
const IAT_SHORT = [
  'Stayed online longer than intended for gaming/social?',
  'Tried to cut down internet use and failed?',
  'Felt restless/irritable when offline?'
];

export default function QuickAddictionTestModal({ open, onClose }) {
  const { isAuthenticated, user } = useUser();

  // view: 'test' => triage & review; 'matching' => therapist list (same Dialog)
  const [view, setView] = useState('test');

  // hide main dialog while auth/booking/quick-connect are open
  const [hideMain, setHideMain] = useState(false);

  // steps within 'test' view
  const [step, setStep] = useState(1); // 1: consent/types, 2: questions, 3: review
  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const [consent, setConsent] = useState(false);
  const [types, setTypes] = useState([]); // ['Alcohol','Drugs','Internet']
  const [durationMonths, setDurationMonths] = useState(0);

  const [audit, setAudit] = useState(() => Array(AUDIT5.length).fill(0));
  const [dast, setDast] = useState(() => Array(DAST_SHORT.length).fill(false));
  const [iat, setIat] = useState(() => Array(IAT_SHORT.length).fill(0));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [matched, setMatched] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const [chosenCounsellor, setChosenCounsellor] = useState(null);

  // persistent focusable element to satisfy HeadlessUI focus trap
  const focusRef = useRef(null);

  // After login, if flow demanded booking, show booking and keep main dialog hidden
  useEffect(() => {
    if (loginOpen && isAuthenticated) {
      setLoginOpen(false);
      if (chosenCounsellor) {
        setBookingOpen(true);
        setHideMain(true);
      }
    }
  }, [loginOpen, isAuthenticated, chosenCounsellor]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setView('test');
      setHideMain(false);
      setStep(1);
      setConsent(false);
      setTypes([]);
      setDurationMonths(0);
      setAudit(Array(AUDIT5.length).fill(0));
      setDast(Array(DAST_SHORT.length).fill(false));
      setIat(Array(IAT_SHORT.length).fill(0));
      setError('');
      setMatched([]);
      setChosenCounsellor(null);
      setLoginOpen(false);
      setBookingOpen(false);
      setQuickOpen(false);
    }
  }, [open]);

  // ----- scoring -----
  const auditScore = useMemo(
    () => audit.reduce((a, b) => a + Number(b || 0), 0),
    [audit]
  ); // 0..20
  const dastScore = useMemo(() => dast.filter(Boolean).length, [dast]); // 0..3
  const iatAvg = useMemo(() => {
    const sum = iat.reduce((a, b) => a + Number(b || 0), 0);
    return Number((sum / (iat.length || 1)).toFixed(2)); // guard /0
  }, [iat]);

  const isPositive = useMemo(() => {
    const alcoholPos = types.includes('Alcohol') && auditScore >= 8;
    const drugsPos = types.includes('Drugs') && dastScore >= 2;
    const netPos = types.includes('Internet') && iatAvg >= 3;
    return alcoholPos || drugsPos || netPos;
  }, [types, auditScore, dastScore, iatAvg]);

  // normalize counsellor shape (ensure .id exists)
  function normalizeCounsellor(c) {
    return {
      ...c,
      id: c?.id ?? c?.counsellorId ?? c?.counselorId ?? c?._id ?? c?.email ?? `${c?.name}-${c?.specialization}`
    };
  }

  // ----- submit -> matching (in same dialog) -----
  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      // Only POST to /assessment when logged in AND we have a userId
      const userId = user?.userId || user?.sub;
      if (isAuthenticated && userId) {
        const payload = {
          category: 'Addiction',
          instrument: 'ADDICTION_TRIAGE',
          userId,
          addictionTypes: types,
          addictionDuration: durationMonths,
          audit5: audit,
          dastShort: dast,
          iatShort: iat,
          triage: { auditScore, dastScore, iatAvg, positive: isPositive }
        };
        try {
          await submitAssessment(payload);
        } catch {
          /* ignore non-2xx; UX continues */
        }
      }

      // switch to matching view
      setView('matching');

      // fetch counsellors via recommender (uses your backend /match/recommend)
      try {
        const recPayload = {
          category: 'Addiction',
          addictionTypes: types,
          audit5: audit,
          dast10: dast,      // we accept short on BE by mapping booleans
          iat10: iat
        };
        const res = await recommendTherapists(recPayload);
        const counsellors = res?.counsellors || res?.matches || [];
        setMatched(counsellors.slice(0, 6));
      } catch {
        setMatched([]);
      }
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ----- renderers -----
  function renderTestStep() {
    if (step === 1) {
      return (
        <QuestionCard className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-lg space-y-5">
          <div className="flex items-start">
            <Checkbox id="consent" checked={!!consent} onCheckedChange={setConsent} />
            <Label htmlFor="consent" className="ml-3 text-gray-700">
              I consent to a brief screening and understand this isn’t a diagnosis.
            </Label>
          </div>

          <div>
            <Label className="block text-gray-800 font-medium mb-2">What brings you here? *</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Alcohol', 'Drugs', 'Internet'].map((opt) => {
                const checked = types.includes(opt);
                return (
                  <label key={opt} className="inline-flex items-center">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(chk) => {
                        const next = chk ? [...types, opt] : types.filter((t) => t !== opt);
                        setTypes(next);
                      }}
                    />
                    <span className="ml-2 text-gray-800">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="block text-gray-800 font-medium mb-2">For how long? (months)</Label>
            <Slider
              min={0}
              max={12}
              value={[Number(durationMonths) || 0]}
              onValueChange={([v]) => setDurationMonths(v)}
            />
            <p className="mt-1 text-sm text-gray-600">{durationMonths} months</p>
          </div>
        </QuestionCard>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          {types.includes('Alcohol') && (
            <QuestionCard className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl">
              <h4 className="text-gray-900 font-semibold mb-3">Alcohol (AUDIT-5)</h4>
              <div className="space-y-4">
                {AUDIT5.map((q, i) => (
                  <div key={i}>
                    <Label className="text-gray-700 text-sm">{q}</Label>
                    <Slider
                      min={0}
                      max={4}
                      value={[audit[i]]}
                      onValueChange={([v]) => {
                        const arr = [...audit];
                        arr[i] = v;
                        setAudit(arr);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">0–4 scale</p>
                  </div>
                ))}
                <div className="text-right text-sm text-gray-600">
                  Estimated risk score: <span className="font-semibold">{auditScore}</span>
                </div>
              </div>
            </QuestionCard>
          )}

          {types.includes('Drugs') && (
            <QuestionCard className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl">
              <h4 className="text-gray-900 font-semibold mb-3">Drugs (DAST-short)</h4>
              <div className="space-y-2">
                {DAST_SHORT.map((q, i) => (
                  <label key={i} className="inline-flex items-start">
                    <Checkbox
                      checked={!!dast[i]}
                      onCheckedChange={(chk) => {
                        const arr = [...dast];
                        arr[i] = chk;
                        setDast(arr);
                      }}
                    />
                    <span className="ml-2 text-gray-700 text-sm">{q}</span>
                  </label>
                ))}
                <div className="text-right text-sm text-gray-600">
                  Yes responses: <span className="font-semibold">{dastScore}</span>
                </div>
              </div>
            </QuestionCard>
          )}

          {types.includes('Internet') && (
            <QuestionCard className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl">
              <h4 className="text-gray-900 font-semibold mb-3">Internet/Gaming (IAT-short)</h4>
              <div className="space-y-4">
                {IAT_SHORT.map((q, i) => (
                  <div key={i}>
                    <Label className="text-gray-700 text-sm">{q}</Label>
                    <Slider
                      min={0}
                      max={5}
                      value={[iat[i]]}
                      onValueChange={([v]) => {
                        const arr = [...iat];
                        arr[i] = v;
                        setIat(arr);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">0–5 scale</p>
                  </div>
                ))}
                <div className="text-right text-sm text-gray-600">
                  Average severity: <span className="font-semibold">{iatAvg}</span>
                </div>
              </div>
            </QuestionCard>
          )}
        </div>
      );
    }

    // step 3 — summary
    return (
      <QuestionCard className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Review</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Areas</span>
          <span className="font-semibold text-gray-900">{types.join(', ') || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span className="font-semibold text-gray-900">{durationMonths} months</span>
        </div>
        {types.includes('Alcohol') && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AUDIT-5 score</span>
            <span className="font-semibold text-gray-900">{auditScore}</span>
          </div>
        )}
        {types.includes('Drugs') && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">DAST-short yes</span>
            <span className="font-semibold text-gray-900">{dastScore}</span>
          </div>
        )}
        {types.includes('Internet') && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IAT-short avg</span>
            <span className="font-semibold text-gray-900">{iatAvg}</span>
          </div>
        )}
        <div
          className={`mt-2 rounded-xl p-3 ${
            isPositive ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isPositive
            ? 'Your answers suggest elevated risk. We recommend matching with a therapist now.'
            : 'Your answers don’t indicate high risk, but support can still help. You can explore therapists if you wish.'}
        </div>
      </QuestionCard>
    );
  }

  function renderMatching() {
    return (
      <div className="space-y-6">
        {!matched.length ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin h-12 w-12 border-4 border-gray-300 border-t-[#c9a96a] rounded-full" />
            <p className="mt-4 text-lg font-semibold text-gray-700">Matching your therapist…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Recommended Therapists</h2>
              {/* Quick-connect also accessible from matches view */}
              <Button
                variant="outline"
                onClick={() => {
                  if (!isAuthenticated) { setLoginOpen(true); return; }
                  setQuickOpen(true);
                  setHideMain(true);
                }}
              >
                Talk to a counsellor now
              </Button>
            </div>

            <ul className="space-y-4 max-h-80 overflow-y-auto">
              {matched.map((raw) => {
                const c = normalizeCounsellor(raw);
                return (
                  <li key={c.id} className="border border-gray-200 p-5 rounded-2xl shadow-lg">
                    <p className="font-semibold text-gray-900 text-lg">{c.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{c.specialization || 'Addiction'}</p>
                    {c.languages && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Languages:</span>{' '}
                        {Array.isArray(c.languages) ? c.languages.join(', ') : c.languages}
                      </p>
                    )}
                    {c.experienceYears && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Experience:</span> {c.experienceYears} years
                      </p>
                    )}
                    {c.feePerSessionINR && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Fee:</span> ₹{c.feePerSessionINR}
                      </p>
                    )}
                    <div className="mt-4 text-right">
                      <Button
                        className="bg-[#23785d] text-white hover:bg-[#19634b] px-5 py-2 rounded-full"
                        onClick={() => {
                          setChosenCounsellor(c);
                          setHideMain(true);
                          if (!isAuthenticated) setLoginOpen(true);
                          else setBookingOpen(true);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    );
  }

  const mainDialogOpen = open && !hideMain;

  return (
    <>
      {/* Single dialog: shows test OR matching */}
      {mainDialogOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="relative z-50"
          initialFocus={focusRef}
        >
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <DialogPanel className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
              {/* Invisible focus target to satisfy FocusTrap */}
              <button ref={focusRef} className="sr-only" aria-hidden="true">focus</button>

              {/* header / stepper */}
              <div className="p-6 flex-shrink-0">
                {view === 'test' ? (
                  <Stepper step={step} />
                ) : (
                  <h3 className="text-xl font-semibold text-gray-900">Therapist Matches</h3>
                )}
              </div>

              {/* content */}
              <div className="px-6 pb-2 overflow-y-auto flex-grow">
                {view === 'test' ? renderTestStep() : renderMatching()}
                {error && <p className="text-red-600 text-center mt-4">{error}</p>}
              </div>

              {/* footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center flex-shrink-0 sticky bottom-0">
                {view === 'test' ? (
                  <>
                    <Button
                      variant="outline"
                      className="text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-full"
                      onClick={back}
                      disabled={step === 1}
                    >
                      Back
                    </Button>
                    {step < 3 ? (
                      <Button
                        className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                        onClick={next}
                        disabled={step === 1 && (!consent || types.length === 0)}
                      >
                        Next
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="px-6 py-2 rounded-full"
                          onClick={() => {
                            if (!isAuthenticated) { setLoginOpen(true); return; }
                            setQuickOpen(true);     // open “talk now”
                            setHideMain(true);
                          }}
                          disabled={loading}
                        >
                          Talk to a counsellor now
                        </Button>
                        <Button
                          className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Submitting…' : isPositive ? 'See matches' : 'See options'}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-full"
                      onClick={() => setView('test')}
                    >
                      Back
                    </Button>
                    <Button
                      className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}

      {/* Auth then Booking — hide main dialog while these are open */}
      <AuthModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          // if user cancels, show main dialog again (matching view if we were matching)
          setHideMain(false);
          if (view !== 'test') setView('matching');
        }}
        skipRedirect
      />

      {/* Quick-connect modal (today’s availability) */}
      <QuickConnectModal
        open={quickOpen}
        onClose={() => {
          setQuickOpen(false);
          setHideMain(false);
        }}
        category="Addiction"
        onSelectCounsellor={(c) => {
          setQuickOpen(false);
          setChosenCounsellor(c);
          // booking path (ensure auth)
          if (!isAuthenticated) {
            setHideMain(true);
            setLoginOpen(true);
            return;
          }
          setHideMain(true);
          setBookingOpen(true);
        }}
      />

      <BookingModal
        open={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          // After closing booking, close the whole flow
          setHideMain(false);
          onClose?.();
        }}
        counsellor={chosenCounsellor}
        user={user}  // <-- pass user so BookingModal can send userId/name
      />
    </>
  );
}
