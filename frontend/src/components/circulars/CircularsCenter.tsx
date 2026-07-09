import { useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  CheckCircle2,
  CalendarClock,
  FileText,
  Megaphone,
  Paperclip,
  RefreshCw,
  Search,
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
  createCircularOnServer,
  createCircularReadReceiptOnServer,
  createCircularReadReceiptsOnServer,
  fetchCircularState,
  resetCircularStateOnServer,
  searchCircularIntelligenceOnServer,
} from '../../lib/api'
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
  CircularIntelligencePayload,
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
  const [noticeQuery, setNoticeQuery] = useState('urgent deadline lab')
  const [noticeResult, setNoticeResult] = useState<CircularIntelligencePayload | null>(null)
  const [noticeLoading, setNoticeLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Checking local backend.')
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

  useEffect(() => {
    let mounted = true

    searchCircularIntelligenceOnServer('')
      .then((payload) => {
        if (mounted) {
          setNoticeResult(payload)
        }
      })
      .catch(() => {
        // The circular list remains usable from browser backup if notice intelligence is unavailable.
      })

    fetchCircularState()
      .then((state) => {
        if (!mounted) {
          return
        }

        setCirculars(state.circulars)
        setReadReceipts(state.readReceipts)
        setBackendStatus('connected')
        setSyncMessage('SQLite backend connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setBackendStatus('offline')
        setSyncMessage('Backend offline; using browser backup.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const runNoticeSearch = async (query: string = noticeQuery) => {
    const cleanQuery = query.trim()
    setNoticeQuery(cleanQuery)
    setNoticeLoading(true)

    try {
      const payload = await searchCircularIntelligenceOnServer(cleanQuery)
      setNoticeResult(payload)
      setBackendStatus('connected')
      setSyncMessage(`${payload.citations.length} notice citations found.`)
    } catch {
      setBackendStatus('offline')
      setSyncMessage('Notice intelligence unavailable; circular list is still available.')
    } finally {
      setNoticeLoading(false)
    }
  }

  const markRead = async (circularId: string) => {
    const alreadyRead = readReceipts.some((receipt) => receipt.actorId === actorId && receipt.circularId === circularId)
    if (alreadyRead) {
      return
    }

    const receipt = {
      actorId,
      circularId,
      readAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setReadReceipts((currentReceipts) => [...currentReceipts, receipt])

    if (backendStatus === 'connected') {
      try {
        await createCircularReadReceiptOnServer(receipt)
        setSyncMessage('Read receipt saved to SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend save failed; read receipt saved in browser backup.')
      }
    }
  }

  const markAllRead = async () => {
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

    if (backendStatus === 'connected') {
      try {
        await createCircularReadReceiptsOnServer(missingReceipts)
        setSyncMessage('Read receipts saved to SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend save failed; read receipts saved in browser backup.')
      }
    }
  }

  const publishCircular = async () => {
    if (!canPublish || !isAdmin) {
      return
    }

    const circularDraft: Circular = {
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

    let circular = circularDraft
    if (backendStatus === 'connected') {
      try {
        circular = await createCircularOnServer(circularDraft)
        setSyncMessage('Circular saved to SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend save failed; circular saved in browser backup.')
      }
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

  const resetCirculars = async () => {
    if (!isAdmin) {
      return
    }

    let nextCirculars = seededCirculars
    let nextReadReceipts: CircularReadReceipt[] = []

    if (backendStatus === 'connected') {
      try {
        const state = await resetCircularStateOnServer()
        nextCirculars = state.circulars
        nextReadReceipts = state.readReceipts
        setSyncMessage('Circulars reset in SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend reset failed; browser backup reset locally.')
      }
    }

    setCirculars(nextCirculars)
    setReadReceipts(nextReadReceipts)
    onAuditEvent(makeAudit(userName, 'Reset circulars', 'Circular demo notices restored to seed state.', 'info'))
  }

  return (
    <section className={clsx('circulars-module', currentRole === 'student' && 'circulars-module--student')}>
      <div className="circulars-header">
        <div>
          <span className="eyebrow">Notices</span>
          <h2>Admin circulars and targeted announcements</h2>
          <p>Role-aware circulars keep students and faculty informed without exposing irrelevant notices.</p>
          <div className={clsx('master-sync-chip', `is-${backendStatus}`)}>
            <span>{backendStatus === 'connected' ? 'SQLite backend' : backendStatus === 'checking' ? 'Checking backend' : 'Browser backup'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="circulars-health">
          <strong>{isAdmin ? activeCount : unreadCount}</strong>
          <span>{isAdmin ? 'active circulars' : 'unread notices'}</span>
        </div>
      </div>

      <section className="panel notice-intelligence-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Notice intelligence</span>
            <h2>Ask circulars and deadlines</h2>
          </div>
          <Search size={20} />
        </div>
        <div className="notice-ai-toolbar">
          <label>
            <Search size={15} />
            <input
              value={noticeQuery}
              onChange={(event) => setNoticeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void runNoticeSearch()
                }
              }}
              placeholder="Ask about circulars, deadlines, lab changes"
              aria-label="Ask circular intelligence"
            />
          </label>
          <button type="button" className="primary-action" disabled={noticeLoading} onClick={() => void runNoticeSearch()}>
            <Search size={16} />
            <span>{noticeLoading ? 'Searching' : 'Search notices'}</span>
          </button>
        </div>
        <div className="notice-ai-samples">
          {['urgent notices', 'deadlines this week', 'lab change', 'unread notices'].map((question) => (
            <button key={question} type="button" onClick={() => void runNoticeSearch(question)}>
              {question}
            </button>
          ))}
        </div>

        {noticeResult ? (
          <>
            <div className="notice-ai-stats">
              <article>
                <BellRing size={17} />
                <span>Visible</span>
                <strong>{noticeResult.stats.visible}</strong>
              </article>
              <article>
                <CheckCircle2 size={17} />
                <span>Unread</span>
                <strong>{noticeResult.stats.unread}</strong>
              </article>
              <article>
                <Megaphone size={17} />
                <span>Urgent</span>
                <strong>{noticeResult.stats.urgent}</strong>
              </article>
              <article>
                <CalendarClock size={17} />
                <span>Deadlines</span>
                <strong>{noticeResult.stats.deadlines}</strong>
              </article>
            </div>
            <div className="notice-ai-answer">
              <strong>{noticeResult.citations.length > 0 ? 'Answer from circulars' : 'No matching circulars'}</strong>
              <p>{noticeResult.answer}</p>
            </div>
            {noticeResult.deadlines.length > 0 ? (
              <div className="notice-deadline-strip">
                {noticeResult.deadlines.map((deadline) => (
                  <span key={deadline.id}>
                    {deadline.title} / {deadline.deadline}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="notice-citation-list">
              {noticeResult.citations.map((citation) => (
                <article key={citation.id} className={clsx('notice-citation', `priority-${citation.priority}`)}>
                  <div>
                    <strong>{citation.title}</strong>
                    <span>
                      {citation.audience} / {citation.deadline} / {citation.read ? 'read' : 'unread'}
                    </span>
                  </div>
                  <p>{citation.snippet}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>

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
