import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  Database,
  GraduationCap,
  LoaderCircle,
  Save,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { updateInstitutionProfileOnServer } from '../../lib/api'
import type { InstitutionProfile, InstitutionState } from '../../types'

type InstitutionSetupProps = {
  state: InstitutionState
  onNavigate: (sectionId: string) => void
  onUpdated: (state: InstitutionState) => void
}

const timezones = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York']

export function InstitutionSetup({ state, onNavigate, onUpdated }: InstitutionSetupProps) {
  const [draft, setDraft] = useState<InstitutionProfile>(state.profile)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('Changes are stored in the college SQLite database and recorded in the audit trail.')

  useEffect(() => {
    setDraft(state.profile)
  }, [state.profile])

  const setField = <Key extends keyof InstitutionProfile>(key: Key, value: InstitutionProfile[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaveState('idle')
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveState('saving')
    setMessage('Saving college profile and policy settings.')
    try {
      const nextState = await updateInstitutionProfileOnServer(draft)
      onUpdated(nextState)
      setSaveState('saved')
      setMessage('College setup saved. Branding and readiness are now up to date.')
    } catch (error) {
      setSaveState('error')
      setMessage(error instanceof Error ? error.message : 'College setup could not be saved.')
    }
  }

  return (
    <section className="institution-setup">
      <div className="setup-hero">
        <div>
          <span className="panel-kicker">College setup</span>
          <h2>Make CampusOps fit your institution</h2>
          <p>Configure the identity and operating rules shown across every role, then follow the rollout checklist to prepare live college data.</p>
        </div>
        <div className="setup-score-card">
          <span>Rollout readiness</span>
          <strong>{state.readiness.score}%</strong>
          <small>{state.readiness.completed} of {state.readiness.total} foundations ready</small>
        </div>
      </div>

      <div className="setup-layout">
        <form className="setup-form panel" onSubmit={save}>
          <div className="home-panel__heading">
            <div>
              <span>Institution profile</span>
              <h3>Identity and academic context</h3>
            </div>
            <Building2 size={20} />
          </div>

          <div className="setup-form-grid">
            <label className="setup-field setup-field--wide">
              <span>Official college name</span>
              <input required minLength={3} value={draft.name} onChange={(event) => setField('name', event.target.value)} />
            </label>
            <label className="setup-field">
              <span>Short name</span>
              <input required minLength={2} value={draft.shortName} onChange={(event) => setField('shortName', event.target.value)} />
            </label>
            <label className="setup-field">
              <span>College code</span>
              <input required minLength={2} maxLength={12} value={draft.code} onChange={(event) => setField('code', event.target.value.toUpperCase())} />
            </label>
            <label className="setup-field">
              <span>Academic year</span>
              <input required value={draft.academicYear} onChange={(event) => setField('academicYear', event.target.value)} placeholder="2026-27" />
            </label>
            <label className="setup-field">
              <span>Current term</span>
              <select value={draft.currentTerm} onChange={(event) => setField('currentTerm', event.target.value)}>
                <option>Odd Semester</option>
                <option>Even Semester</option>
                <option>Trimester 1</option>
                <option>Trimester 2</option>
                <option>Trimester 3</option>
                <option>Annual Term</option>
              </select>
            </label>
            <label className="setup-field">
              <span>Timezone</span>
              <select value={draft.timezone} onChange={(event) => setField('timezone', event.target.value)}>
                {timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}
              </select>
            </label>
            <label className="setup-field">
              <span>Attendance shortage alert (%)</span>
              <input
                required
                type="number"
                min={1}
                max={100}
                value={draft.attendanceThreshold}
                onChange={(event) => setField('attendanceThreshold', Number(event.target.value))}
              />
            </label>
            <label className="setup-field">
              <span>Institution email domain</span>
              <div className="setup-domain-input"><span>@</span><input required value={draft.emailDomain} onChange={(event) => setField('emailDomain', event.target.value)} /></div>
            </label>
            <label className="setup-field">
              <span>College website</span>
              <input type="url" value={draft.website} onChange={(event) => setField('website', event.target.value)} />
            </label>
          </div>

          <div className={`setup-save-status is-${saveState}`} role="status">
            {saveState === 'saving' ? <LoaderCircle className="is-spinning" size={17} /> : saveState === 'saved' ? <CheckCircle2 size={17} /> : <ShieldCheck size={17} />}
            <span>{message}</span>
          </div>

          <button type="submit" className="primary-action setup-save-button" disabled={saveState === 'saving'}>
            <Save size={16} />
            {saveState === 'saving' ? 'Saving setup' : 'Save college setup'}
          </button>
        </form>

        <aside className="setup-readiness panel">
          <div className="home-panel__heading">
            <div>
              <span>Adoption checklist</span>
              <h3>Prepare for a college pilot</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="institution-progress"><span style={{ width: `${state.readiness.score}%` }} /></div>
          <div className="setup-checklist">
            {state.readiness.steps.map((step) => (
              <button key={step.id} type="button" onClick={() => onNavigate(step.targetSection)}>
                {step.complete ? <CheckCircle2 className="is-complete" size={19} /> : <Circle size={19} />}
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.complete ? 'Configured' : step.detail}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="setup-data-strip">
        <article><Building2 size={18} /><span><strong>{state.stats.departments}</strong> departments</span></article>
        <article><GraduationCap size={18} /><span><strong>{state.stats.students}</strong> students</span></article>
        <article><UsersRound size={18} /><span><strong>{state.stats.staff}</strong> active staff</span></article>
        <article><Database size={18} /><span><strong>{state.stats.knowledgeDocuments}</strong> policy documents</span></article>
      </div>
    </section>
  )
}
