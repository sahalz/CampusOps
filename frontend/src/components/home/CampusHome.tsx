import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  Database,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from 'lucide-react'
import type { InstitutionState, Role } from '../../types'

type CampusHomeProps = {
  currentRole: Role
  userName: string
  state: InstitutionState
  status: 'loading' | 'connected' | 'offline'
  onNavigate: (sectionId: string) => void
  onRefresh: () => void
}

type HomeMetric = {
  label: string
  value: string | number
  detail: string
  icon: typeof LayoutDashboard
  tone: 'blue' | 'red' | 'amber' | 'green'
  target: string
}

function formatToday() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function firstName(name: string) {
  const cleanName = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
  return cleanName.split(' ')[0] || name
}

export function CampusHome({ currentRole, userName, state, status, onNavigate, onRefresh }: CampusHomeProps) {
  const { profile, readiness, stats, dashboard } = state

  const metrics: HomeMetric[] = currentRole === 'admin'
    ? [
        {
          label: 'Open actions',
          value: dashboard.openActions,
          detail: 'Across college operations',
          icon: ClipboardCheck,
          tone: 'blue',
          target: 'action-center',
        },
        {
          label: 'Critical today',
          value: dashboard.criticalActions,
          detail: 'Needs same-day attention',
          icon: AlertTriangle,
          tone: 'red',
          target: 'action-center',
        },
        {
          label: 'Active students',
          value: stats.students,
          detail: `${stats.classSections} class sections`,
          icon: GraduationCap,
          tone: 'green',
          target: 'academics',
        },
        {
          label: 'Rollout readiness',
          value: `${readiness.score}%`,
          detail: `${readiness.completed} of ${readiness.total} foundations ready`,
          icon: ShieldCheck,
          tone: 'amber',
          target: 'college-setup',
        },
      ]
    : currentRole === 'faculty'
      ? [
          {
            label: 'My actions',
            value: dashboard.openActions,
            detail: 'Assigned operational follow-ups',
            icon: ClipboardCheck,
            tone: 'blue',
            target: 'action-center',
          },
          {
            label: 'Attendance gaps',
            value: dashboard.attendanceGaps,
            detail: 'Registers needing attention',
            icon: AlertTriangle,
            tone: 'red',
            target: 'academics',
          },
          {
            label: 'Mapped periods',
            value: dashboard.scheduledPeriods,
            detail: 'Across your timetable',
            icon: CalendarDays,
            tone: 'green',
            target: 'academics',
          },
          {
            label: 'Leave decisions',
            value: dashboard.pendingLeaves,
            detail: 'Waiting for your review',
            icon: Clock3,
            tone: 'amber',
            target: 'academics',
          },
        ]
      : [
          {
            label: 'My attendance',
            value: dashboard.attendancePercent === null ? '—' : `${dashboard.attendancePercent}%`,
            detail: `Shortage alert below ${profile.attendanceThreshold}%`,
            icon: GraduationCap,
            tone: dashboard.attendancePercent !== null && dashboard.attendancePercent < profile.attendanceThreshold ? 'red' : 'green',
            target: 'academics',
          },
          {
            label: 'Mapped periods',
            value: dashboard.scheduledPeriods,
            detail: 'In your current timetable',
            icon: CalendarDays,
            tone: 'blue',
            target: 'academics',
          },
          {
            label: 'Pending leave',
            value: dashboard.pendingLeaves,
            detail: 'Requests awaiting decision',
            icon: Clock3,
            tone: 'amber',
            target: 'academics',
          },
          {
            label: 'Unread notices',
            value: dashboard.unreadCirculars,
            detail: 'Active notices for you',
            icon: BellRing,
            tone: 'blue',
            target: 'circulars',
          },
        ]

  const quickLinks = currentRole === 'admin'
    ? [
        ['Review action inbox', 'Prioritized attendance, leave, workload, and mapping exceptions.', 'action-center', ClipboardCheck],
        ['Run academic operations', 'Map the timetable, mark attendance, and manage period-wise leave.', 'academics', CalendarDays],
        ['Upload college data', 'Map PDF, CSV, or XLSX student lists and timetables before saving.', 'imports', UploadCloud],
        ['Open reports', 'Export shortage, leave, workload, coverage, and engagement reports.', 'reports', LayoutDashboard],
        ['Manage policy knowledge', 'Add trusted institutional documents for cited answers.', 'knowledge', BookOpenCheck],
        ['College settings', 'Set identity, academic term, timezone, and attendance policy.', 'college-setup', Settings2],
      ] as const
    : currentRole === 'faculty'
      ? [
          ['Open my timetable', 'See assigned periods and attendance registers.', 'academics', CalendarDays],
          ['Review my actions', 'Work through assigned attendance and leave follow-ups.', 'action-center', ClipboardCheck],
          ['Read circulars', 'Check active faculty and department notices.', 'circulars', BellRing],
          ['Search policies', 'Get cited answers from college rules and procedures.', 'knowledge', BookOpenCheck],
        ] as const
      : [
          ['View my timetable', 'See mapped subjects, rooms, and period timings.', 'academics', CalendarDays],
          ['Check attendance', 'Review subject attendance and shortage risk.', 'academics', GraduationCap],
          ['Read circulars', 'See notices and deadlines relevant to you.', 'circulars', BellRing],
          ['Ask a policy question', 'Find cited answers about attendance, leave, and campus rules.', 'knowledge', BookOpenCheck],
        ] as const

  const incompleteSteps = readiness.steps.filter((step) => !step.complete)

  return (
    <section className="campus-home" aria-label="Campus home">
      <div className="home-hero">
        <div className="home-hero__copy">
          <span className="home-date">{formatToday()}</span>
          <h2>Good day, {firstName(userName)}</h2>
          <p>
            {currentRole === 'admin'
              ? `Here is the operating picture for ${profile.shortName}. Start with the exceptions that need a decision.`
              : currentRole === 'faculty'
                ? 'Your timetable, registers, approvals, and notices are organized here for a quicker working day.'
                : 'Your classes, attendance health, leave requests, and college notices are together in one place.'}
          </p>
          <div className="home-context-row">
            <span>{profile.academicYear}</span>
            <span>{profile.currentTerm}</span>
            <span>{profile.code}</span>
          </div>
        </div>
        <div className="home-hero__status">
          <span className={`home-live-status is-${status}`}>
            <Circle size={8} fill="currentColor" />
            {status === 'connected' ? 'Live college data' : status === 'loading' ? 'Refreshing data' : 'Demo backup'}
          </span>
          <button type="button" className="home-refresh" onClick={onRefresh}>
            <RefreshCw size={15} />
            Refresh overview
          </button>
        </div>
      </div>

      <div className="home-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <button
              key={metric.label}
              type="button"
              className={`home-metric-card tone-${metric.tone}`}
              onClick={() => onNavigate(metric.target)}
            >
              <span className="home-metric-icon"><Icon size={19} /></span>
              <span>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
                <em>{metric.detail}</em>
              </span>
              <ArrowRight size={16} />
            </button>
          )
        })}
      </div>

      <div className="home-main-grid">
        <section className="home-panel home-panel--quick">
          <div className="home-panel__heading">
            <div>
              <span>{currentRole === 'admin' ? 'Operate' : 'My workspace'}</span>
              <h3>{currentRole === 'admin' ? 'Move work forward' : 'Start with what you need'}</h3>
            </div>
            <LayoutDashboard size={19} />
          </div>
          <div className="home-quick-grid">
            {quickLinks.map(([title, detail, target, Icon]) => (
              <button key={title} type="button" onClick={() => onNavigate(target)}>
                <span className="home-quick-icon"><Icon size={18} /></span>
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>

        {currentRole === 'admin' ? (
          <aside className="home-panel home-panel--readiness">
            <div className="home-panel__heading">
              <div>
                <span>Adoption guide</span>
                <h3>College rollout readiness</h3>
              </div>
              <strong className="readiness-score">{readiness.score}%</strong>
            </div>
            <div className="readiness-track" aria-label={`${readiness.score}% rollout readiness`}>
              <span style={{ width: `${readiness.score}%` }} />
            </div>
            <div className="readiness-list">
              {readiness.steps.map((step) => (
                <button key={step.id} type="button" onClick={() => onNavigate(step.targetSection)}>
                  {step.complete ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.complete ? 'Ready' : step.detail}</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            {incompleteSteps.length > 0 ? (
              <button type="button" className="home-primary-link" onClick={() => onNavigate(incompleteSteps[0].targetSection)}>
                Continue setup
                <ArrowRight size={15} />
              </button>
            ) : null}
          </aside>
        ) : (
          <aside className="home-panel home-panel--snapshot">
            <div className="home-panel__heading">
              <div>
                <span>College context</span>
                <h3>{profile.shortName}</h3>
              </div>
              <Database size={19} />
            </div>
            <dl className="home-snapshot-list">
              <div><dt>Academic year</dt><dd>{profile.academicYear}</dd></div>
              <div><dt>Current term</dt><dd>{profile.currentTerm}</dd></div>
              <div><dt>Shortage alert</dt><dd>Below {profile.attendanceThreshold}%</dd></div>
              <div><dt>Departments</dt><dd>{stats.departments}</dd></div>
            </dl>
          </aside>
        )}
      </div>

      {currentRole === 'admin' ? (
        <div className="home-foundation-strip">
          <span><UsersRound size={16} /><strong>{stats.staff}</strong> active staff</span>
          <span><GraduationCap size={16} /><strong>{stats.students}</strong> students</span>
          <span><BookOpenCheck size={16} /><strong>{stats.subjects}</strong> active subjects</span>
          <span><CalendarDays size={16} /><strong>{stats.timetableSlots}</strong> mapped periods</span>
        </div>
      ) : null}
    </section>
  )
}
