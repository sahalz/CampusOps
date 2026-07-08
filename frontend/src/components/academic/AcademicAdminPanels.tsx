import {
  AlertTriangle,
  Check,
  CircleCheck,
  ClipboardPaste,
  FileSpreadsheet,
  MapPinned,
  Plus,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import clsx from 'clsx'
import { academicDays } from '../../data/academic'
import type { AcademicDay } from '../../types'
import { useAcademicWorkspace, type ImportType } from './AcademicWorkspaceContext'

export function SetupWizard() {
  const { resetAcademicData, setupProgress, setupSteps, validateSetup } = useAcademicWorkspace()

  return (
    <section className="panel setup-wizard">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Guided setup</span>
          <h2>Launch checklist</h2>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="setup-progress">
        <strong>{setupProgress}%</strong>
        <span>ready for daily use</span>
      </div>
      <div className="setup-step-list">
        {setupSteps.map((step) => (
          <article key={step.label} className={clsx(step.complete && 'is-complete')}>
            <CircleCheck size={17} />
            <div>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="setup-actions">
        <button type="button" className="secondary-action" onClick={validateSetup}>
          <Check size={15} />
          <span>Check setup</span>
        </button>
        <button type="button" className="secondary-action" onClick={resetAcademicData}>
          <RotateCcw size={15} />
          <span>Load sample setup</span>
        </button>
      </div>
    </section>
  )
}

export function ImportCenter() {
  const {
    applyImport,
    importLabels,
    importPreview,
    importSamples,
    importText,
    importType,
    setImportText,
    setImportType,
  } = useAcademicWorkspace()

  return (
    <section className="panel import-center">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Excel ready</span>
          <h2>CSV import center</h2>
        </div>
        <FileSpreadsheet size={20} />
      </div>
      <div className="import-controls">
        <select
          value={importType}
          onChange={(event) => {
            const nextType = event.target.value as ImportType
            setImportType(nextType)
            setImportText(importSamples[nextType])
          }}
        >
          {(Object.keys(importLabels) as ImportType[]).map((type) => (
            <option key={type} value={type}>
              {importLabels[type]}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-action" onClick={() => setImportText(importSamples[importType])}>
          <ClipboardPaste size={15} />
          <span>Sample</span>
        </button>
      </div>
      <textarea
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
        aria-label={`${importLabels[importType]} CSV`}
      />
      <div className="import-preview">
        <strong>{importPreview.validCount} valid rows</strong>
        <span>{importPreview.errors.length} errors / {importPreview.warnings.length} warnings</span>
      </div>
      {importPreview.errors.length > 0 || importPreview.warnings.length > 0 ? (
        <div className="import-issues">
          {[...importPreview.errors, ...importPreview.warnings].slice(0, 3).map((issue) => (
            <span key={issue}>{issue}</span>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="primary-action primary-action--wide"
        disabled={importPreview.validCount === 0}
        onClick={applyImport}
      >
        <Upload size={16} />
        <span>Apply import</span>
      </button>
    </section>
  )
}

export function TimetableMapper() {
  const {
    applyDraftPeriod,
    classSections,
    conflicts,
    draft,
    mapSlot,
    sectionById,
    setDraft,
    subjectById,
    subjects,
    teachers,
    updateDraftClass,
    updateDraftSubject,
  } = useAcademicWorkspace()

  return (
    <section className="panel academic-panel--mapper">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Admin entry</span>
          <h2>Timetable mapper</h2>
        </div>
        <MapPinned size={20} />
      </div>
      <div className="mapper-form">
        <label>
          Class
          <select value={draft.classSectionId} onChange={(event) => updateDraftClass(event.target.value)}>
            {classSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} / Sem {section.semester}
              </option>
            ))}
          </select>
        </label>
        <label>
          Day
          <select
            value={draft.day}
            onChange={(event) =>
              setDraft((currentDraft) => ({ ...currentDraft, day: event.target.value as AcademicDay }))
            }
          >
            {academicDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label>
          Period
          <select value={draft.periodNumber} onChange={(event) => applyDraftPeriod(Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map((period) => (
              <option key={period} value={period}>
                Period {period}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start
          <input
            type="time"
            value={draft.startTime}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, startTime: event.target.value }))}
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={draft.endTime}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, endTime: event.target.value }))}
          />
        </label>
        <label>
          Subject
          <select value={draft.subjectId} onChange={(event) => updateDraftSubject(event.target.value)}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} / {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Teacher
          <select
            value={draft.teacherId}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, teacherId: event.target.value }))}
          >
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Room
          <input
            value={draft.room}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, room: event.target.value }))}
          />
        </label>
      </div>

      {conflicts.length > 0 ? (
        <div className="conflict-box">
          <AlertTriangle size={18} />
          <div>
            <strong>Mapping blocked</strong>
            {conflicts.map((conflict) => (
              <span key={conflict}>{conflict}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mapping-preview">
          <Check size={18} />
          <span>
            Ready to map {sectionById.get(draft.classSectionId)?.name} period {draft.periodNumber} to{' '}
            {subjectById.get(draft.subjectId)?.code}.
          </span>
        </div>
      )}

      <button
        type="button"
        className="primary-action primary-action--wide"
        disabled={conflicts.length > 0}
        onClick={mapSlot}
      >
        <Plus size={16} />
        <span>Map timetable slot</span>
      </button>
    </section>
  )
}
