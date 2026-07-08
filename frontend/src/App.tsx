import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Database,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  IdCard,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  PlugZap,
  RefreshCw,
  School,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import './App.css'
import { AcademicOperations } from './components/AcademicOperations'
import { CircularsCenter } from './components/circulars/CircularsCenter'
import {
  approvalItems as seededApprovals,
  auditEvents as seededAuditEvents,
  evaluationMetrics,
  integrations,
  knowledgeDocs,
  requestCases,
  securityControls,
  workflowTemplates,
} from './data/platform'
import { routeCampusRequest } from './lib/agent'
import {
  authSessionStorageKey,
  fetchAuditEvents,
  fetchAuthUsers,
  fetchCurrentAuthSession,
  loginOnServer,
  logoutOnServer,
  persistAuditEvent,
} from './lib/api'
import type { ApprovalItem, ApprovalStatus, AuditEvent, RiskLevel, Role, RouteResult, UserAccount } from './types'

const WorkflowCanvas = lazy(() =>
  import('./components/WorkflowCanvas').then((module) => ({ default: module.WorkflowCanvas })),
)
const StaffRegister = lazy(() =>
  import('./components/staff/StaffRegister').then((module) => ({ default: module.StaffRegister })),
)
const MasterDataCenter = lazy(() =>
  import('./components/master-data/MasterDataCenter').then((module) => ({ default: module.MasterDataCenter })),
)
const ImportCenter = lazy(() =>
  import('./components/imports/ImportCenter').then((module) => ({ default: module.ImportCenter })),
)
const ReportsCenter = lazy(() =>
  import('./components/reports/ReportsCenter').then((module) => ({ default: module.ReportsCenter })),
)

const roleLabels: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
}

const roleNotes: Record<Role, string> = {
  student: 'Checks timetable, attendance percentage, leave status, and period-wise approval updates.',
  faculty: 'Marks attendance, reviews leave for assigned hours, and sees teaching load by timetable slot.',
  admin: 'Maps classes, students, teachers, rooms, subjects, timetable periods, and automation controls.',
}

const authStorageKey = 'campusops-session-v1'

const demoAccounts: UserAccount[] = [
  {
    id: 'admin-office',
    role: 'admin',
    name: 'Dr. Priya Menon',
    title: 'Academic Admin',
    email: 'admin@campus.edu',
    actorId: 'admin-office',
    summary: 'Setup, imports, timetable mapping, reports, audits, and all approvals.',
  },
  {
    id: 'faculty-anjali',
    role: 'faculty',
    name: 'Prof. Anjali Rao',
    title: 'Faculty',
    email: 'anjali.rao@campus.edu',
    actorId: 't-anjali',
    summary: 'Daily periods, attendance register, assigned leave approvals, and class workload.',
  },
  {
    id: 'student-aisha',
    role: 'student',
    name: 'Aisha Khan',
    title: 'Student',
    email: 'aisha.khan@campus.edu',
    actorId: 's-aisha',
    summary: 'Today’s timetable, attendance status, leave application, and request tracking.',
  },
]

const freeStack = [
  { label: 'Frontend', value: 'Vite + React + Tailwind' },
  { label: 'Workflow', value: 'React Flow + local state machine' },
  { label: 'AI', value: 'Local router, Ollama ready' },
  { label: 'Data', value: 'Supabase or PostgreSQL free tier' },
  { label: 'Deploy', value: 'Netlify, Render, or Railway free tier' },
]

const kpiCards = [
  {
    label: 'Academic workflows',
    value: '6',
    detail: 'Leave, attendance, mapping',
    icon: ClipboardCheck,
    tone: 'green',
  },
  {
    label: 'Timetable routing',
    value: 'Live',
    detail: 'Class, teacher, room checks',
    icon: Clock3,
    tone: 'blue',
  },
  {
    label: 'Guardrail pass',
    value: '99%',
    detail: 'Unsafe actions blocked',
    icon: ShieldCheck,
    tone: 'amber',
  },
  {
    label: 'Monthly AI cost',
    value: 'INR 0',
    detail: 'Local-first demo mode',
    icon: CircleDollarSign,
    tone: 'slate',
  },
]

const samplePrompts = [
  'Rahul needs medical leave for Monday period 1 Data Structures and wants attendance marked excused after approval.',
  'Admin wants to map CSE-A Monday period 4 to Artificial Intelligence with Prof. Anjali Rao in B-204.',
  'A student reports hostel water issues and wants urgent escalation to the warden.',
]

function riskLabel(risk: RiskLevel) {
  return risk.charAt(0).toUpperCase() + risk.slice(1)
}

function readStoredSessionId() {
  try {
    return window.localStorage.getItem(authStorageKey)
  } catch {
    return null
  }
}

function readStoredAuthToken() {
  try {
    return window.localStorage.getItem(authSessionStorageKey)
  } catch {
    return null
  }
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(() => (readStoredAuthToken() ? readStoredSessionId() : null))
  const [sessionUser, setSessionUser] = useState<UserAccount | null>(null)
  const [accounts, setAccounts] = useState<UserAccount[]>(demoAccounts)
  const [authStatus, setAuthStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [authMessage, setAuthMessage] = useState('Checking SQLite identity.')
  const [activeWorkflowId, setActiveWorkflowId] = useState(workflowTemplates[0].id)
  const [intakeInput, setIntakeInput] = useState(samplePrompts[1])
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [approvals, setApprovals] = useState<ApprovalItem[]>(seededApprovals)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(seededAuditEvents)
  const [activeNavId, setActiveNavId] = useState('academics')
  const session = sessionUser ?? accounts.find((account) => account.id === sessionId) ?? null
  const activeRole = session?.role ?? 'admin'

  const activeWorkflow = useMemo(
    () => workflowTemplates.find((workflow) => workflow.id === activeWorkflowId) ?? workflowTemplates[0],
    [activeWorkflowId],
  )

  const workflowMap = useMemo(
    () => new Map(workflowTemplates.map((workflow) => [workflow.id, workflow])),
    [],
  )

  const visibleCases = useMemo(() => {
    if (activeRole === 'admin') {
      return requestCases
    }

    return requestCases.filter((request) => request.role === activeRole || request.role === 'student')
  }, [activeRole])

  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending')
  const showAdvancedAutomation = activeRole === 'admin'
  const showApprovalPanel = activeRole !== 'student'
  const navItems = useMemo(
    () =>
      [
        {
          id: 'academics',
          label: 'Academics',
          icon: LayoutDashboard,
          roles: ['admin', 'faculty', 'student'] as Role[],
          targetId: 'section-academics',
        },
        {
          id: 'timetable',
          label: 'Timetable',
          icon: GitBranch,
          roles: ['admin', 'faculty', 'student'] as Role[],
          targetId: 'section-academics',
        },
        {
          id: 'master-data',
          label: 'Master Data',
          icon: School,
          roles: ['admin', 'faculty'] as Role[],
          targetId: 'section-master-data',
        },
        {
          id: 'imports',
          label: 'Imports',
          icon: UploadCloud,
          roles: ['admin'] as Role[],
          targetId: 'section-imports',
        },
        {
          id: 'reports',
          label: activeRole === 'admin' ? 'Reports' : 'My Reports',
          icon: FileSpreadsheet,
          roles: ['admin', 'faculty'] as Role[],
          targetId: 'section-reports',
        },
        {
          id: 'circulars',
          label: 'Circulars',
          icon: BellRing,
          roles: ['admin', 'faculty', 'student'] as Role[],
          targetId: 'section-circulars',
        },
        {
          id: 'staff',
          label: 'Staff',
          icon: IdCard,
          roles: ['admin', 'faculty'] as Role[],
          targetId: 'section-staff',
        },
        {
          id: 'approvals',
          label: 'Approvals',
          icon: ClipboardCheck,
          roles: ['admin', 'faculty'] as Role[],
          targetId: 'section-approvals',
        },
        {
          id: 'knowledge',
          label: 'Knowledge',
          icon: Database,
          roles: ['admin', 'faculty', 'student'] as Role[],
          targetId: 'section-knowledge',
        },
        {
          id: 'security',
          label: 'Security',
          icon: LockKeyhole,
          roles: ['admin'] as Role[],
          targetId: 'section-security',
        },
        {
          id: 'evaluation',
          label: 'Evaluation',
          icon: Gauge,
          roles: ['admin'] as Role[],
          targetId: 'section-evaluation',
        },
      ].filter((item) => item.roles.includes(activeRole)),
    [activeRole],
  )

  useEffect(() => {
    let mounted = true

    fetchAuthUsers()
      .then((users) => {
        if (!mounted) {
          return
        }

        setAccounts(users)
        setAuthStatus('connected')
        setAuthMessage('SQLite identity backend connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setAccounts(demoAccounts)
        setAuthStatus('offline')
        setAuthMessage('Backend offline; using demo login backup.')
      })

    const token = readStoredAuthToken()
    if (token) {
      fetchCurrentAuthSession()
        .then((authSession) => {
          if (!mounted) {
            return
          }

          setSessionUser(authSession.user)
          setSessionId(authSession.user.id)
          setAuthStatus('connected')
          setAuthMessage('SQLite RBAC session restored.')
        })
        .catch(() => {
          if (!mounted) {
            return
          }

          try {
            window.localStorage.removeItem(authSessionStorageKey)
          } catch {
            // Ignore storage cleanup failure.
          }
        })
    }

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    fetchAuditEvents()
      .then((events) => {
        if (mounted && events.length > 0) {
          setAuditEvents(events.slice(0, 14))
        }
      })
      .catch(() => {
        // Backend can be offline during frontend-only demo mode; seeded audit events still show.
      })

    return () => {
      mounted = false
    }
  }, [])

  const runRouter = () => {
    const result = routeCampusRequest(intakeInput, workflowTemplates, knowledgeDocs)
    setRouteResult(result)
    setActiveWorkflowId(result.workflowId)
    setAuditEvents((currentEvents) => [...result.trace, ...currentEvents].slice(0, 14))
    result.trace.forEach((event) => {
      void persistAuditEvent(event).catch(() => {
        // Keep routing usable if backend persistence is unavailable.
      })
    })
  }

  const appendAuditEvent = (event: AuditEvent, persist = true) => {
    setAuditEvents((currentEvents) => [event, ...currentEvents].slice(0, 14))
    if (persist) {
      void persistAuditEvent(event).catch(() => {
        // Keep the UI responsive even if the local backend has not been started.
      })
    }
  }

  const resolveApproval = (approvalId: string, status: ApprovalStatus) => {
    const approval = approvals.find((item) => item.id === approvalId)
    setApprovals((currentApprovals) =>
      currentApprovals.map((item) => (item.id === approvalId ? { ...item, status } : item)),
    )

    if (!approval) {
      return
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    appendAuditEvent({
        id: `AUD-${Date.now()}`,
        time,
        actor: `${roleLabels[activeRole]} reviewer`,
        action: status === 'approved' ? 'Approved request' : 'Blocked request',
        outcome: `${approval.id} moved to ${status}.`,
        severity: status === 'approved' ? 'success' : 'critical',
      })
  }

  const resetDemo = () => {
    setRouteResult(null)
    setIntakeInput(samplePrompts[1])
    setActiveWorkflowId(workflowTemplates[0].id)
    setApprovals(seededApprovals)
    setAuditEvents(seededAuditEvents)
  }

  const login = (account: UserAccount) => {
    const openLocalSession = () => {
      setSessionId(account.id)
      setSessionUser(account)
      try {
        window.localStorage.setItem(authStorageKey, account.id)
      } catch {
        // Session still works in-memory if storage is unavailable.
      }
    }

    if (authStatus === 'offline') {
      openLocalSession()
      return
    }

    setAuthMessage('Starting SQLite RBAC session.')
    loginOnServer(account.id)
      .then((authSession) => {
        setSessionUser(authSession.user)
        setSessionId(authSession.user.id)
        try {
          window.localStorage.setItem(authStorageKey, authSession.user.id)
        } catch {
          // Session still works in-memory if storage is unavailable.
        }
        setAuthStatus('connected')
        setAuthMessage('SQLite RBAC session active.')
      })
      .catch(() => {
        openLocalSession()
        setAuthStatus('offline')
        setAuthMessage('Backend login unavailable; using demo login backup.')
      })
  }

  const logout = () => {
    void logoutOnServer().catch(() => {
      // Backend session may already be unavailable; local logout still succeeds.
    })
    setSessionId(null)
    setSessionUser(null)
    try {
      window.localStorage.removeItem(authStorageKey)
      window.localStorage.removeItem(authSessionStorageKey)
    } catch {
      // Ignore storage cleanup failure.
    }
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="login-brand">
            <div className="brand-mark">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="eyebrow">CampusOps AI</span>
              <h1>Choose your workspace</h1>
              <p>Each login opens a focused academic operations view with only the tools that role needs.</p>
              <div className={clsx('master-sync-chip', `is-${authStatus}`)}>
                <span>{authStatus === 'connected' ? 'SQLite identity' : authStatus === 'checking' ? 'Checking identity' : 'Demo backup'}</span>
                <strong>{authMessage}</strong>
              </div>
            </div>
          </div>
          <div className="login-grid">
            {accounts.map((account) => (
              <button key={account.id} type="button" className="login-card" onClick={() => login(account)}>
                <span className={clsx('login-role-icon', `role-${account.role}`)}>
                  {account.role === 'admin' ? <ShieldCheck size={20} /> : <UserRound size={20} />}
                </span>
                <div>
                  <strong>{account.title}</strong>
                  <span>{account.name}</span>
                  <small>{account.summary}</small>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>CampusOps AI</strong>
            <span>Agentic operations OS</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={clsx('nav-item', activeNavId === item.id && 'is-active')}
                onClick={() => {
                  setActiveNavId(item.id)
                  document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="free-stack">
          <div className="free-stack__header">
            <span>Free-first stack</span>
            <BadgeCheck size={16} />
          </div>
          {freeStack.map((item) => (
            <div key={item.label} className="stack-row">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Academic operations automation</span>
            <h1>Timetable-aware attendance and leave OS</h1>
          </div>
          <div className="topbar-actions">
            <div className="session-chip">
              <UserCheck size={16} />
              <div>
                <strong>{session.name}</strong>
                <span>{roleLabels[session.role]}</span>
              </div>
            </div>
            <button type="button" className="icon-button" aria-label="Refresh demo" onClick={resetDemo}>
              <RefreshCw size={18} />
            </button>
            <button type="button" className="icon-button" aria-label="Sign out" onClick={logout}>
              <LogOut size={18} />
            </button>
            <button type="button" className="primary-action" onClick={runRouter}>
              <Send size={16} />
              <span>Route request</span>
            </button>
          </div>
        </header>

        <section className="kpi-grid" aria-label="Platform metrics">
          {kpiCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.label} className={clsx('kpi-card', `tone-${card.tone}`)}>
                <span className="kpi-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.detail}</small>
                </div>
              </article>
            )
          })}
        </section>

        <section className="role-switcher session-overview" aria-label="Logged in role">
          <div>
            <strong>{session.title} workspace</strong>
            <span>{session.email}</span>
          </div>
          <p>{roleNotes[activeRole]}</p>
        </section>

        <div id="section-academics" className="section-anchor">
          <AcademicOperations
            currentRole={session.role}
            actorId={session.actorId}
            userName={session.name}
            onAuditEvent={appendAuditEvent}
          />
        </div>

        {activeRole !== 'student' ? (
          <div id="section-master-data" className="section-anchor">
            <Suspense
              fallback={
                <div className="master-data-loading">
                  <School size={18} />
                  <strong>Loading master data</strong>
                  <span>Preparing department and subject registers.</span>
                </div>
              }
            >
              <MasterDataCenter
                currentRole={session.role}
                actorId={session.actorId}
                userName={session.name}
                onAuditEvent={appendAuditEvent}
              />
            </Suspense>
          </div>
        ) : null}

        {activeRole === 'admin' ? (
          <div id="section-imports" className="section-anchor">
            <Suspense
              fallback={
                <div className="import-loading">
                  <UploadCloud size={18} />
                  <strong>Loading import center</strong>
                  <span>Preparing CSV and XLSX import validation.</span>
                </div>
              }
            >
              <ImportCenter
                currentRole={session.role}
                userName={session.name}
                onAuditEvent={appendAuditEvent}
              />
            </Suspense>
          </div>
        ) : null}

        {activeRole !== 'student' ? (
          <div id="section-reports" className="section-anchor">
            <Suspense
              fallback={
                <div className="reports-loading">
                  <FileSpreadsheet size={18} />
                  <strong>Loading reports</strong>
                  <span>Preparing administrative reports and exports.</span>
                </div>
              }
            >
              <ReportsCenter
                currentRole={session.role}
                actorId={session.actorId}
                userName={session.name}
                onAuditEvent={appendAuditEvent}
              />
            </Suspense>
          </div>
        ) : null}

        <div id="section-circulars" className="section-anchor">
          <CircularsCenter
            currentRole={session.role}
            actorId={session.actorId}
            userName={session.name}
            onAuditEvent={appendAuditEvent}
          />
        </div>

        {activeRole !== 'student' ? (
          <div id="section-staff" className="section-anchor">
          <Suspense
            fallback={
              <div className="staff-module-loading">
                <IdCard size={18} />
                <strong>Loading staff register</strong>
                <span>Preparing staff profile and workload data.</span>
              </div>
            }
          >
            <StaffRegister
              currentRole={session.role}
              actorId={session.actorId}
              userName={session.name}
              onAuditEvent={appendAuditEvent}
            />
          </Suspense>
          </div>
        ) : null}

        <div
          className={clsx(
            'dashboard-grid',
            !showAdvancedAutomation && 'dashboard-grid--compact',
            activeRole === 'student' && 'dashboard-grid--student',
          )}
        >
          <section className="panel panel--intake">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">AI intake</span>
                <h2>Request router</h2>
              </div>
              <Bot size={20} />
            </div>
            <textarea
              value={intakeInput}
              onChange={(event) => setIntakeInput(event.target.value)}
              aria-label="Campus request"
            />
            <div className="sample-row">
              {samplePrompts.map((prompt, index) => (
                <button key={prompt} type="button" onClick={() => setIntakeInput(prompt)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <button type="button" className="primary-action primary-action--wide" onClick={runRouter}>
              <Sparkles size={16} />
              <span>Run agent route</span>
            </button>

            {routeResult ? (
              <div className={clsx('route-result', `risk-${routeResult.safety.level}`)}>
                <div className="route-result__score">
                  <strong>{routeResult.confidence}%</strong>
                  <span>confidence</span>
                </div>
                <div>
                  <h3>{workflowMap.get(routeResult.workflowId)?.title}</h3>
                  <p>{routeResult.routeReason}</p>
                  <div className="route-tags">
                    <span>{riskLabel(routeResult.safety.level)} risk</span>
                    <span>{routeResult.requiredApproval ? 'Approval gate' : 'Auto-run ready'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <SearchCheck size={18} />
                <span>Ready for classification</span>
              </div>
            )}
          </section>

          {showAdvancedAutomation ? (
            <section className="panel panel--builder">
              <Suspense
                fallback={
                  <div className="workflow-loading">
                    <GitBranch size={18} />
                    <strong>Loading workflow builder</strong>
                    <span>Admin automation tools are being prepared.</span>
                  </div>
                }
              >
                <WorkflowCanvas
                  activeWorkflow={activeWorkflow}
                  templates={workflowTemplates}
                  onTemplateChange={setActiveWorkflowId}
                />
              </Suspense>
            </section>
          ) : null}

          <section className="panel panel--queue">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{roleLabels[activeRole]} view</span>
                <h2>Live queue</h2>
              </div>
              <Activity size={20} />
            </div>
            <div className="case-list">
              {visibleCases.map((request) => (
                <article key={request.id} className="case-row">
                  <div>
                    <span>{request.id}</span>
                    <strong>{request.title}</strong>
                    <small>{request.requester}</small>
                  </div>
                  <div className="case-row__meta">
                    <span className={clsx('risk-pill', `risk-${request.priority}`)}>{riskLabel(request.priority)}</span>
                    <small>{request.eta}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div
          className={clsx(
            'insight-grid',
            !showAdvancedAutomation && 'insight-grid--compact',
            !showApprovalPanel && 'insight-grid--student',
          )}
        >
          <section id="section-knowledge" className="panel section-anchor">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">RAG</span>
                <h2>Knowledge base</h2>
              </div>
              <BookOpenCheck size={20} />
            </div>
            <div className="knowledge-list">
              {(routeResult?.retrievedDocs ?? knowledgeDocs.slice(0, 4)).map((doc) => (
                <article key={doc.id} className="knowledge-row">
                  <div>
                    <strong>{doc.title}</strong>
                    <span>{doc.source} / {doc.freshness}</span>
                  </div>
                  <div className="meter" aria-label={`${doc.coverage} percent coverage`}>
                    <span style={{ width: `${doc.coverage}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {showApprovalPanel ? (
          <section id="section-approvals" className="panel section-anchor">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{pendingApprovals.length} pending</span>
                <h2>Human approvals</h2>
              </div>
              <UserCheck size={20} />
            </div>
            <div className="approval-list">
              {approvals.map((approval) => (
                <article key={approval.id} className={clsx('approval-row', `is-${approval.status}`)}>
                  <div>
                    <span>{approval.id} / {riskLabel(approval.risk)}</span>
                    <strong>{approval.title}</strong>
                    <small>{approval.requester} / {approval.due}</small>
                  </div>
                  {approval.status === 'pending' ? (
                    <div className="approval-actions">
                      <button
                        type="button"
                        className="icon-button icon-button--approve"
                        aria-label={`Approve ${approval.id}`}
                        onClick={() => resolveApproval(approval.id, 'approved')}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--block"
                        aria-label={`Block ${approval.id}`}
                        onClick={() => resolveApproval(approval.id, 'blocked')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="status-chip">{approval.status}</span>
                  )}
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showAdvancedAutomation ? (
          <section id="section-security" className="panel section-anchor">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">OWASP aligned</span>
                <h2>Guardrails</h2>
              </div>
              <ShieldCheck size={20} />
            </div>
            <div className="security-list">
              {securityControls.map((control) => (
                <article key={control.id} className="security-row">
                  <div className="security-row__top">
                    <strong>{control.title}</strong>
                    <span className={clsx('status-dot', `is-${control.status}`)}>{control.mappedRisk}</span>
                  </div>
                  <p>{control.signal}</p>
                </article>
              ))}
            </div>
          </section>
          ) : null}
        </div>

        {showAdvancedAutomation ? (
        <div className="bottom-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Traceability</span>
                <h2>Audit trail</h2>
              </div>
              <MessageSquareText size={20} />
            </div>
            <div className="audit-list">
              {auditEvents.map((event) => (
                <article key={event.id} className={clsx('audit-row', `severity-${event.severity}`)}>
                  <span>{event.time}</span>
                  <div>
                    <strong>{event.actor} / {event.action}</strong>
                    <p>{event.outcome}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="section-evaluation" className="panel section-anchor">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Quality</span>
                <h2>Evaluation</h2>
              </div>
              <Gauge size={20} />
            </div>
            <div className="metric-list">
              {evaluationMetrics.map((metric) => (
                <article key={metric.label} className="metric-row">
                  <div>
                    <strong>{metric.label}</strong>
                    <span>{metric.trend}</span>
                  </div>
                  <div className="metric-bar">
                    <span style={{ width: `${metric.value}%` }} />
                  </div>
                  <small>{metric.value}{metric.unit} / target {metric.target}{metric.unit}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Adapters</span>
                <h2>Integrations</h2>
              </div>
              <PlugZap size={20} />
            </div>
            <div className="integration-list">
              {integrations.map((integration) => (
                <article key={integration.id} className="integration-row">
                  <BellRing size={17} />
                  <div>
                    <strong>{integration.title}</strong>
                    <span>{integration.type} / {integration.cost}</span>
                  </div>
                  <ChevronRight size={16} />
                </article>
              ))}
            </div>
          </section>
        </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
