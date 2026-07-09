import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Filter,
  Inbox,
  RefreshCw,
  Search,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import {
  fetchActionCenter,
  recordActionCenterActionOnServer,
  type ActionCenterQuery,
} from '../../lib/api'
import type {
  ActionCategory,
  ActionCenterItem,
  ActionCenterPayload,
  ActionSeverity,
  ActionTargetSection,
  AuditEvent,
  Role,
} from '../../types'

type ActionCenterProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent, persist?: boolean) => void
  onNavigate: (section: ActionTargetSection) => void
}

type KpiCard = {
  label: string
  value: number
  detail: string
  icon: LucideIcon
  tone: 'red' | 'amber' | 'blue' | 'green'
}

const emptyActionCenter: ActionCenterPayload = {
  version: 1,
  source: 'sqlite',
  generatedAt: '',
  filters: {
    department: 'all',
    semester: 'all',
    date: '',
    status: 'all',
    role: 'admin',
    actorId: '',
  },
  filterOptions: {
    departments: [],
    semesters: [],
    dates: [],
    categories: [],
    severities: ['all', 'critical', 'warning', 'info'],
  },
  summary: {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    attendanceGaps: 0,
    pendingLeaves: 0,
    shortageStudents: 0,
    overloadedFaculty: 0,
    coverageGaps: 0,
    inactiveRecords: 0,
    circularsWithUnread: 0,
  },
  categories: [],
  items: [],
}

const categoryIcons: Record<ActionCategory, LucideIcon> = {
  Attendance: ClipboardCheck,
  Leave: CalendarClock,
  Workload: UsersRound,
  Mapping: BookOpenCheck,
  'Master data': Filter,
  Circulars: BellRing,
}

const categoryFallbacks: ActionCategory[] = [
  'Attendance',
  'Leave',
  'Workload',
  'Mapping',
  'Master data',
  'Circulars',
]

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

function normalizeLabel(value: string) {
  if (value === 'all') {
    return 'All'
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  if (!value) {
    return 'No date'
  }

  return value
}

function formatGeneratedAt(value: string) {
  if (!value) {
    return 'Not synced'
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function searchActionItems(items: ActionCenterItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return items
  }

  return items.filter((item) =>
    [
      item.title,
      item.detail,
      item.category,
      item.owner,
      item.source,
      item.metricLabel,
      String(item.metricValue),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  )
}

function ActionSeverityPill({ severity }: { severity: ActionSeverity }) {
  return <span className={clsx('action-severity-pill', `is-${severity}`)}>{normalizeLabel(severity)}</span>
}

function ActionItemCard({
  item,
  reviewed,
  onOpen,
  onReview,
}: {
  item: ActionCenterItem
  reviewed: boolean
  onOpen: (item: ActionCenterItem) => void
  onReview: (item: ActionCenterItem) => void
}) {
  const Icon = categoryIcons[item.category] ?? Inbox

  return (
    <article className={clsx('action-item-card', `severity-${item.severity}`, reviewed && 'is-reviewed')}>
      <div className="action-item-icon">
        <Icon size={18} />
      </div>
      <div className="action-item-main">
        <div className="action-item-topline">
          <span>{item.category}</span>
          <ActionSeverityPill severity={item.severity} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
        <div className="action-item-meta">
          <span>{item.owner}</span>
          <span>{formatDate(item.dueDate)}</span>
          <span>{item.source}</span>
          {item.metricLabel ? (
            <strong>{item.metricLabel}: {item.metricValue}</strong>
          ) : null}
        </div>
      </div>
      <div className="action-item-actions">
        <button type="button" className="secondary-action" onClick={() => onOpen(item)}>
          <ExternalLink size={15} />
          <span>{item.actionLabel}</span>
        </button>
        <button type="button" className="secondary-action" disabled={reviewed} onClick={() => onReview(item)}>
          <CheckCircle2 size={15} />
          <span>{reviewed ? 'Reviewed' : 'Mark reviewed'}</span>
        </button>
      </div>
    </article>
  )
}

export function ActionCenter({ currentRole, actorId, userName, onAuditEvent, onNavigate }: ActionCenterProps) {
  const [payload, setPayload] = useState<ActionCenterPayload>(emptyActionCenter)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActionCategory>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | ActionSeverity>('all')
  const [query, setQuery] = useState('')
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => new Set())
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Checking local backend.')
  const [refreshToken, setRefreshToken] = useState(0)
  const isAdmin = currentRole === 'admin'

  const actionQuery = useMemo<ActionCenterQuery>(
    () => ({
      department: departmentFilter,
      semester: semesterFilter,
      date: dateFilter,
      role: currentRole,
      actorId,
    }),
    [actorId, currentRole, dateFilter, departmentFilter, semesterFilter],
  )

  useEffect(() => {
    let mounted = true
    setBackendStatus((currentStatus) => (currentStatus === 'offline' ? 'offline' : 'checking'))

    fetchActionCenter(actionQuery)
      .then((nextPayload) => {
        if (!mounted) {
          return
        }

        setPayload(nextPayload)
        setBackendStatus('connected')
        setSyncMessage('SQLite backend connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setPayload(emptyActionCenter)
        setBackendStatus('offline')
        setSyncMessage('Action center backend unavailable.')
      })

    return () => {
      mounted = false
    }
  }, [actionQuery, refreshToken])

  const auditAction = async (
    action: string,
    item: Pick<ActionCenterItem, 'title'>,
    outcome: string,
    severity: AuditEvent['severity'] = 'success',
  ) => {
    if (backendStatus === 'connected') {
      try {
        const auditEvent = await recordActionCenterActionOnServer({
          actor: userName,
          action,
          actionItemTitle: item.title,
          outcome,
          severity,
        })
        onAuditEvent(auditEvent, false)
        return
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Action audit saved in browser backup.')
      }
    }

    onAuditEvent(makeAudit(userName, action, outcome, severity))
  }

  const openAction = (item: ActionCenterItem) => {
    void auditAction('Opened action item', item, `${item.title} opened from Action Center.`, 'info')
    onNavigate(item.targetSection)
  }

  const reviewAction = (item: ActionCenterItem) => {
    setReviewedIds((currentIds) => new Set(currentIds).add(item.id))
    void auditAction('Marked action reviewed', item, `${item.title} marked reviewed in Action Center.`, 'success')
  }

  const refreshActions = () => {
    setRefreshToken((currentToken) => currentToken + 1)
    void auditAction(
      'Refreshed action center',
      { title: 'Action Center' },
      'Action Center refreshed by user.',
      'info',
    )
  }

  const filteredItems = useMemo(() => {
    const categoryItems =
      categoryFilter === 'all' ? payload.items : payload.items.filter((item) => item.category === categoryFilter)
    const severityItems =
      severityFilter === 'all' ? categoryItems : categoryItems.filter((item) => item.severity === severityFilter)

    return searchActionItems(severityItems, query)
  }, [categoryFilter, payload.items, query, severityFilter])

  const openItems = filteredItems.filter((item) => !reviewedIds.has(item.id))
  const reviewedItems = filteredItems.filter((item) => reviewedIds.has(item.id))
  const categoryOptions = payload.filterOptions.categories.length > 0 ? payload.filterOptions.categories : categoryFallbacks
  const actionCount = Math.max(payload.summary.total - reviewedIds.size, 0)

  const kpiCards: KpiCard[] = [
    {
      label: isAdmin ? 'Open actions' : 'My actions',
      value: actionCount,
      detail: `${reviewedIds.size} reviewed this session`,
      icon: Inbox,
      tone: 'blue',
    },
    {
      label: 'Critical',
      value: payload.summary.critical,
      detail: 'needs same-day attention',
      icon: AlertTriangle,
      tone: 'red',
    },
    {
      label: 'Pending leave',
      value: payload.summary.pendingLeaves,
      detail: isAdmin ? 'faculty decisions' : 'assigned to me',
      icon: CalendarClock,
      tone: 'amber',
    },
    {
      label: 'Attendance gaps',
      value: payload.summary.attendanceGaps + payload.summary.shortageStudents,
      detail: 'marking and shortage items',
      icon: ClipboardCheck,
      tone: 'green',
    },
  ]

  if (currentRole === 'student') {
    return null
  }

  return (
    <section className="action-center">
      <div className="action-header">
        <div>
          <span className="eyebrow">{isAdmin ? 'Action center' : 'My action center'}</span>
          <h2>{isAdmin ? 'Daily admin inbox' : 'My operational inbox'}</h2>
          <p>
            Prioritized work from attendance, leave, workload, circular engagement, timetable mapping, and master data.
          </p>
          <div className={clsx('master-sync-chip', `is-${backendStatus}`)}>
            <span>{backendStatus === 'connected' ? 'SQLite backend' : backendStatus === 'checking' ? 'Checking backend' : 'Browser backup'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="action-header-metric">
          <strong>{actionCount}</strong>
          <span>open actions</span>
          <small>Updated {formatGeneratedAt(payload.generatedAt)}</small>
        </div>
      </div>

      <div className="action-toolbar">
        <label className="action-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search action inbox"
            aria-label="Search action inbox"
          />
        </label>
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="all">All departments</option>
          {payload.filterOptions.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
          <option value="all">All semesters</option>
          {payload.filterOptions.semesters.map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          aria-label="Filter action center by date"
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | ActionCategory)}>
          <option value="all">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as 'all' | ActionSeverity)}>
          {payload.filterOptions.severities.map((severity) => (
            <option key={severity} value={severity}>
              {normalizeLabel(severity)}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-action" onClick={refreshActions}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="action-kpis">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className={clsx('action-kpi', `tone-${card.tone}`)}>
              <Icon size={18} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </article>
          )
        })}
      </div>

      <div className="action-layout">
        <section className="panel action-inbox-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">{openItems.length} open</span>
              <h2>Priority inbox</h2>
            </div>
            <Inbox size={20} />
          </div>

          {openItems.length > 0 ? (
            <div className="action-list">
              {openItems.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  reviewed={reviewedIds.has(item.id)}
                  onOpen={openAction}
                  onReview={reviewAction}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state empty-state--boxed">
              <CheckCircle2 size={18} />
              <span>{backendStatus === 'offline' ? 'Action items need the backend.' : 'No open actions match the filters.'}</span>
            </div>
          )}
        </section>

        <aside className="action-side">
          <section className="panel action-breakdown-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Workload mix</span>
                <h2>By category</h2>
              </div>
              <Filter size={20} />
            </div>
            <div className="action-category-list">
              {payload.categories.length > 0 ? (
                payload.categories.map((category) => {
                  const Icon = categoryIcons[category.label] ?? Filter
                  return (
                    <button
                      key={category.label}
                      type="button"
                      className={clsx('action-category-row', categoryFilter === category.label && 'is-active')}
                      onClick={() => setCategoryFilter(category.label)}
                    >
                      <Icon size={16} />
                      <span>{category.label}</span>
                      <strong>{category.count}</strong>
                    </button>
                  )
                })
              ) : (
                <div className="empty-state empty-state--boxed">
                  <UserRoundCheck size={18} />
                  <span>No categories to review.</span>
                </div>
              )}
            </div>
          </section>

          <section className="panel action-reviewed-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{reviewedItems.length} reviewed</span>
                <h2>Session review</h2>
              </div>
              <CheckCircle2 size={20} />
            </div>
            {reviewedItems.length > 0 ? (
              <div className="action-reviewed-list">
                {reviewedItems.slice(0, 5).map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.category} / {item.metricLabel}: {item.metricValue}</span>
                  </article>
                ))}
                <button type="button" className="secondary-action" onClick={() => setReviewedIds(new Set())}>
                  <RefreshCw size={15} />
                  <span>Reset reviewed</span>
                </button>
              </div>
            ) : (
              <div className="empty-state empty-state--boxed">
                <CheckCircle2 size={18} />
                <span>No reviewed actions yet.</span>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
