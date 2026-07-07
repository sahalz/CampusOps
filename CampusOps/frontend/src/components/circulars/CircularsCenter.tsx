import { useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  CheckCircle2,
  FileText,
  Megaphone,
  Paperclip,
  RefreshCw,
  Send,
} from 'lucide-react'
import clsx from 'clsx'
import {
  classSections,
  students,
  teachers,
} from '../../data/academic'
import { circulars as seededCirculars } from '../../data/circulars'
import {
  formatAudience,
  isCircularActive,
  isCircularVisibleTo,
  rankCircularPriority,
} from '../../lib/circulars'
import type {
  AuditEvent,
  Circular,
  CircularAudience,
  CircularPriority,
  CircularReadReceipt,
  Role,
} from '../../types'

type CircularsCenterProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent) => void
}

type CircularDraft = {
  title: string
  body: string
  priority: CircularPriority
  audienceValue: string
  expiresAt: string
  attachmentName: string
}

type StoredCircularState = {
  version: 1
  circulars: Circular[]
  readReceipts: CircularReadReceipt[]
}

const storageKey = 'campusops-circulars-state-v1'
const today = '2026-07-07'

const defaultDraft: CircularDraft = {
  title: 'Internal assessment schedule published',
  body: 'The internal assessment schedule has been published. Students must check their class timetable and report conflicts through the academic office.',
  priority: 'important',
  audienceValue: 'students',
  expiresAt: '2026-07-20',
  attachmentName: 'assessment-schedule.pdf',
}

function makeAudit(actor: string, action: string, outcome: string, severity: AuditEvent['severity']): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor,
    action,
    outcome,
    severity,
  }
}

function readStoredCircularState(): StoredCircularState | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredCircularState>
    if (parsed.version !== 1 || !Array.isArray(parsed.circulars) || !Array.isArray(parsed.readReceipts)) {
      return null
    }

    return parsed as StoredCircularState
  } catch {
    return null
  }
}

function writeStoredCircularState(state: StoredCircularState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Keep the circular module functional with in-memory state if browser storage fails.
  }
}

function parseAudience(value: string): CircularAudience {
  if (value.startsWith('class:')) {
    return {
      type: 'class',
      classSectionId: value.replace('class:', ''),
    }
  }

  if (value.startsWith('department:')) {
    return {
      type: 'department',
      department: value.replace('department:', ''),
    }
  }

  if (value === 'students' || value === 'faculty' || value === 'everyone') {
    return { type: value }
  }

  return { type: 'everyone' }
}

function describeAudience(audience: CircularAudience) {
  if (audience.type === 'class') {
    return classSections.find((section) => section.id === audience.classSectionId)?.name ?? 'Selected class'
  }

  return formatAudience(audience)
}

function priorityLabel(priority: CircularPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

export function CircularsCenter({ currentRole, actorId, userName, onAuditEvent }: CircularsCenterProps) {
  const [storedState] = useState(() => readStoredCircularState())
  const [circulars, setCirculars] = useState<Circular[]>(() => storedState?.circulars ?? seededCirculars)
  const [readReceipts, setReadReceipts] = useState<CircularReadReceipt[]>(
    () => storedState?.readReceipts ?? [],
  )
  const [draft, setDraft] = useState<CircularDraft>(defaultDraft)
  const isAdmin = currentRole === 'admin'

  const departments = useMemo(
    () => Array.from(new Set(teachers.map((teacher) => teacher.department))).sort(),
    [],
  )

  const visibleCirculars = useMemo(
    () =>
      circulars
        .filter((circular) =>
          isCircularVisibleTo(circular, {
            role: currentRole,
            actorId,
            classSections,
            students,
            teachers,
          }),
        )
        .filter((circular) => isAdmin || isCircularActive(circular, today))
        .sort(
          (first, second) =>
            rankCircularPriority(first.priority) - rankCircularPriority(second.priority) ||
            second.publishedAt.localeCompare(first.publishedAt),
        ),
    [actorId, circulars, currentRole, isAdmin],
  )

  const unreadCount = visibleCirculars.filter(
    (circular) => !readReceipts.some((receipt) => receipt.actorId === actorId && receipt.circularId === circular.id),
  ).length
  const activeCount = circulars.filter((circular) => isCircularActive(circular, today)).length
  const canPublish = draft.title.trim().length >= 6 && draft.body.trim().length >= 16

  useEffect(() => {
    writeStoredCircularState({
      version: 1,
      circulars,
      readReceipts,
    })
  }, [circulars, readReceipts])

  const markRead = (circularId: string) => {
    const alreadyRead = readReceipts.some((receipt) => receipt.actorId === actorId && receipt.circularId === circularId)
    if (alreadyRead) {
      return
    }

    setReadReceipts((currentReceipts) => [
      ...currentReceipts,
      {
        actorId,
        circularId,
        readAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  const markAllRead = () => {
    const missingReceipts = visibleCirculars
      .filter((circular) => !readReceipts.some((receipt) => receipt.actorId === actorId && receipt.circularId === circular.id))
      .map((circular) => ({
        actorId,
        circularId: circular.id,
        readAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))

    if (missingReceipts.length === 0) {
      return
    }

    setReadReceipts((currentReceipts) => [...currentReceipts, ...missingReceipts])
  }

  const publishCircular = () => {
    if (!canPublish || !isAdmin) {
      return
    }

    const circular: Circular = {
      id: `CIR-${Date.now().toString(36).toUpperCase()}`,
      title: draft.title.trim(),
      body: draft.body.trim(),
      priority: draft.priority,
      audience: parseAudience(draft.audienceValue),
      publishedAt: today,
      expiresAt: draft.expiresAt || undefined,
      attachmentName: draft.attachmentName.trim() || undefined,
      createdBy: userName,
    }

    setCirculars((currentCirculars) => [circular, ...currentCirculars])
    setDraft(defaultDraft)
    onAuditEvent(
      makeAudit(
        userName,
        'Published circular',
        `${circular.title} sent to ${describeAudience(circular.audience)}.`,
        circular.priority === 'urgent' ? 'warning' : 'success',
      ),
    )
  }

  const resetCirculars = () => {
    if (!isAdmin) {
      return
    }

    setCirculars(seededCirculars)
    setReadReceipts([])
    onAuditEvent(makeAudit(userName, 'Reset circulars', 'Circular demo notices restored to seed state.', 'info'))
  }

  return (
    <section className={clsx('circulars-module', currentRole === 'student' && 'circulars-module--student')}>
      <div className="circulars-header">
        <div>
          <span className="eyebrow">Notices</span>
          <h2>Admin circulars and targeted announcements</h2>
          <p>Role-aware circulars keep students and faculty informed without exposing irrelevant notices.</p>
        </div>
        <div className="circulars-health">
          <strong>{isAdmin ? activeCount : unreadCount}</strong>
          <span>{isAdmin ? 'active circulars' : 'unread notices'}</span>
        </div>
      </div>

      <div className={clsx('circulars-grid', isAdmin && 'circulars-grid--admin')}>
        <section className="panel circulars-list-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">{visibleCirculars.length} visible</span>
              <h2>{isAdmin ? 'Circular register' : 'My notices'}</h2>
            </div>
            <BellRing size={20} />
          </div>

          <div className="notice-toolbar">
            <button type="button" className="secondary-action" disabled={unreadCount === 0} onClick={markAllRead}>
              <CheckCircle2 size={15} />
              <span>Mark all read</span>
            </button>
            {isAdmin ? (
              <button type="button" className="secondary-action" onClick={resetCirculars}>
                <RefreshCw size={15} />
                <span>Reset notices</span>
              </button>
            ) : null}
          </div>

          <div className="circular-list">
            {visibleCirculars.map((circular) => {
              const read = readReceipts.some(
                (receipt) => receipt.actorId === actorId && receipt.circularId === circular.id,
              )
              const active = isCircularActive(circular, today)
              return (
                <article
                  key={circular.id}
                  className={clsx(
                    'circular-row',
                    `priority-${circular.priority}`,
                    read && 'is-read',
                    !active && 'is-expired',
                  )}
                >
                  <div className="circular-row__top">
                    <span>{circular.id}</span>
                    <span className={clsx('priority-pill', `priority-${circular.priority}`)}>
                      {priorityLabel(circular.priority)}
                    </span>
                  </div>
                  <strong>{circular.title}</strong>
                  <p>{circular.body}</p>
                  <div className="circular-meta">
                    <span>{describeAudience(circular.audience)}</span>
                    <span>Published {circular.publishedAt}</span>
                    {circular.expiresAt ? <span>Expires {circular.expiresAt}</span> : null}
                  </div>
                  {circular.attachmentName ? (
                    <div className="attachment-chip">
                      <Paperclip size={14} />
                      <span>{circular.attachmentName}</span>
                    </div>
                  ) : null}
                  <div className="circular-actions">
                    <span className="status-chip">{active ? (read ? 'read' : 'unread') : 'expired'}</span>
                    {!read && active ? (
                      <button type="button" className="secondary-action" onClick={() => markRead(circular.id)}>
                        <CheckCircle2 size={15} />
                        <span>Mark read</span>
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {isAdmin ? (
          <section className="panel circular-composer">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Admin composer</span>
                <h2>Publish circular</h2>
              </div>
              <Megaphone size={20} />
            </div>
            <div className="composer-form">
              <label>
                Title
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
                />
              </label>
              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      priority: event.target.value as CircularPriority,
                    }))
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label>
                Target
                <select
                  value={draft.audienceValue}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({ ...currentDraft, audienceValue: event.target.value }))
                  }
                >
                  <option value="everyone">Everyone</option>
                  <option value="students">All students</option>
                  <option value="faculty">All faculty</option>
                  {classSections.map((section) => (
                    <option key={section.id} value={`class:${section.id}`}>
                      {section.name}
                    </option>
                  ))}
                  {departments.map((department) => (
                    <option key={department} value={`department:${department}`}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Expires
                <input
                  type="date"
                  value={draft.expiresAt}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, expiresAt: event.target.value }))}
                />
              </label>
              <label>
                Attachment name
                <input
                  value={draft.attachmentName}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({ ...currentDraft, attachmentName: event.target.value }))
                  }
                  placeholder="notice.pdf"
                />
              </label>
              <label>
                Message
                <textarea
                  value={draft.body}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, body: event.target.value }))}
                />
              </label>
              <button
                type="button"
                className="primary-action primary-action--wide"
                disabled={!canPublish}
                onClick={publishCircular}
              >
                <Send size={16} />
                <span>Publish circular</span>
              </button>
            </div>
            <div className="composer-note">
              <FileText size={16} />
              <span>Attachments are tracked as metadata in this free demo; real upload can be added with Supabase Storage.</span>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}
