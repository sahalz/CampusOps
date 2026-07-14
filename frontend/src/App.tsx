import { Fragment, Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BellRing,
  BookOpenCheck,
  Bot,
  Check,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  IdCard,
  Inbox,
  House,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  PlugZap,
  RefreshCw,
  School,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Settings2,
  UploadCloud,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import './App.css'
import { AcademicOperations } from './components/AcademicOperations'
import { CircularsCenter } from './components/circulars/CircularsCenter'
import { CampusHome } from './components/home/CampusHome'
import { InstitutionSetup } from './components/settings/InstitutionSetup'
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
  fetchInstitutionState,
  loginOnServer,
  logoutOnServer,
  persistAuditEvent,
} from './lib/api'
import { demoInstitutionState } from './data/institution'
import type { ApprovalItem, ApprovalStatus, AuditEvent, InstitutionState, RiskLevel, Role, RouteResult, UserAccount } from './types'

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
const KnowledgeCenter = lazy(() =>
  import('./components/knowledge/KnowledgeCenter').then((module) => ({ default: module.KnowledgeCenter })),
)
const ReportsCenter = lazy(() =>
  import('./components/reports/ReportsCenter').then((module) => ({ default: module.ReportsCenter })),
)
const ActionCenter = lazy(() =>
  import('./components/actions/ActionCenter').then((module) => ({ default: module.ActionCenter })),
)
const AutomationCenter = lazy(() =>
  import('./components/automation/AutomationCenter').then((module) => ({ default: module.AutomationCenter })),
)

const roleLabels: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
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

const samplePrompts = [
  'Rahul needs medical leave for Monday period 1 Data Structures and wants attendance marked excused after approval.',
  'Admin wants to map CSE-A Monday period 4 to Artificial Intelligence with Prof. Anjali Rao in B-204.',
  'A student reports hostel water issues and wants urgent escalation to the warden.',
]

const sectionDescriptions: Record<string, { eyebrow: string; title: string; copy: string }> = {
  home: {
    eyebrow: 'Campus command',
    title: 'Home',
    copy: 'A role-aware overview of today’s work, operational health, and the next best action.',
  },
  'action-center': {
    eyebrow: 'Daily action',
    title: 'Tasks',
    copy: 'Prioritized admin and faculty work from attendance, leave, circulars, workload, timetable mapping, and master data.',
  },
  academics: {
    eyebrow: 'Daily operations',
    title: 'Academics',
    copy: 'Manage timetable mapping, attendance, leave, and the day-to-day academic register from one focused workspace.',
  },
  'master-data': {
    eyebrow: 'Setup',
    title: 'Master Data',
    copy: 'Keep departments and subject records clean before they are used in imports, timetable mapping, and reports.',
  },
  imports: {
    eyebrow: 'Bulk entry',
    title: 'Upload Data',
    copy: 'Add student lists, staff records, subjects, and timetables from PDF, CSV, or XLSX with automatic mapping and validation.',
  },
  reports: {
    eyebrow: 'Office reports',
    title: 'Reports',
    copy: 'Review attendance shortage, leave, workload, circular engagement, and daily operations exports.',
  },
  circulars: {
    eyebrow: 'Communication',
    title: 'Notices',
    copy: 'Publish notices, target the right audience, and track read receipts without leaving the admin console.',
  },
  staff: {
    eyebrow: 'People',
    title: 'Staff Register',
    copy: 'Maintain faculty profiles, workload links, contact details, and staff status in a readable register.',
  },
  approvals: {
    eyebrow: 'Action queue',
    title: 'Approvals',
    copy: 'Handle pending human approvals in a dedicated queue instead of hunting through the full page.',
  },
  knowledge: {
    eyebrow: 'Reference',
    title: 'Knowledge Base',
    copy: 'Review the policy and process documents used by the routing assistant.',
  },
  security: {
    eyebrow: 'Controls',
    title: 'Security',
    copy: 'Check guardrails and administrative controls for safe workflow automation.',
  },
  evaluation: {
    eyebrow: 'Quality',
    title: 'Evaluation',
    copy: 'Track quality metrics and integration readiness separately from daily admin work.',
  },
  audit: {
    eyebrow: 'Traceability',
    title: 'Audit Trail',
    copy: 'See recent actions recorded by imports, reports, resets, routing, and approval workflows.',
  },
  automation: {
    eyebrow: 'AI assistant',
    title: 'Request Router',
    copy: 'Use the agent workflow tools only when you need routing, workflow simulation, or automation review.',
  },
  'automation-control': {
    eyebrow: 'Operations engine',
    title: 'Automation Control',
    copy: 'Run live college checks, manage human approval gates, suppress duplicates, and review notification delivery.',
  },
  'college-setup': {
    eyebrow: 'Adoption',
    title: 'College Settings',
    copy: 'Configure your institution identity, academic context, operating policy, and rollout foundations.',
  },
}

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
  const [activeNavId, setActiveNavId] = useState('home')
  const [institutionState, setInstitutionState] = useState<InstitutionState>(demoInstitutionState)
  const [institutionStatus, setInstitutionStatus] = useState<'loading' | 'connected' | 'offline'>('loading')
  const [showMoreTools, setShowMoreTools] = useState(false)
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
  const allNavItems = useMemo(
    () =>
      [
        {
          id: 'home',
          label: 'Home',
          icon: House,
          group: 'Workspace',
          roles: ['admin', 'faculty', 'student'] as Role[],
        },
        {
          id: 'action-center',
          label: activeRole === 'admin' ? 'Tasks' : 'My Tasks',
          icon: Inbox,
          group: 'Operate',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'academics',
          label: 'Academics',
          icon: LayoutDashboard,
          group: 'Operate',
          roles: ['admin', 'faculty', 'student'] as Role[],
        },
        {
          id: 'master-data',
          label: 'Data Setup',
          icon: School,
          group: 'Data',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'imports',
          label: 'Upload Data',
          icon: UploadCloud,
          group: 'Data',
          roles: ['admin'] as Role[],
        },
        {
          id: 'reports',
          label: activeRole === 'admin' ? 'Reports' : 'My Reports',
          icon: FileSpreadsheet,
          group: 'Data',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'circulars',
          label: 'Notices',
          icon: BellRing,
          group: 'Operate',
          roles: ['admin', 'faculty', 'student'] as Role[],
        },
        {
          id: 'staff',
          label: 'Staff',
          icon: IdCard,
          group: 'Data',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'approvals',
          label: 'Approvals',
          icon: ClipboardCheck,
          group: 'Operate',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'knowledge',
          label: 'Knowledge',
          icon: Database,
          group: 'Intelligence',
          roles: ['admin', 'faculty', 'student'] as Role[],
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: MessageSquareText,
          group: 'Governance',
          roles: ['admin', 'faculty'] as Role[],
        },
        {
          id: 'automation-control',
          label: 'Automation',
          icon: PlugZap,
          group: 'Intelligence',
          roles: ['admin'] as Role[],
        },
        {
          id: 'automation',
          label: 'AI Router',
          icon: Bot,
          group: 'Intelligence',
          roles: ['admin'] as Role[],
        },
        {
          id: 'security',
          label: 'Security',
          icon: LockKeyhole,
          group: 'Governance',
          roles: ['admin'] as Role[],
        },
        {
          id: 'evaluation',
          label: 'Evaluation',
          icon: Gauge,
          group: 'Governance',
          roles: ['admin'] as Role[],
        },
        {
          id: 'college-setup',
          label: 'College Settings',
          icon: Settings2,
          group: 'Governance',
          roles: ['admin'] as Role[],
        },
      ]
        .filter((item) => item.roles.includes(activeRole))
        .sort(
          (first, second) =>
            ['Workspace', 'Operate', 'Data', 'Intelligence', 'Governance'].indexOf(first.group) -
            ['Workspace', 'Operate', 'Data', 'Intelligence', 'Governance'].indexOf(second.group),
        ),
    [activeRole],
  )
  const navItems = useMemo(() => {
    if (activeRole !== 'admin' || showMoreTools) {
      return allNavItems
    }

    const everydayAdminSections = new Set([
      'home',
      'action-center',
      'academics',
      'circulars',
      'imports',
      'reports',
      'staff',
      'automation-control',
      'college-setup',
    ])
    return allNavItems.filter((item) => everydayAdminSections.has(item.id) || item.id === activeNavId)
  }, [activeNavId, activeRole, allNavItems, showMoreTools])
  const sectionMeta = sectionDescriptions[activeNavId] ?? sectionDescriptions.academics

  const refreshInstitution = () => {
    setInstitutionStatus('loading')
    fetchInstitutionState()
      .then((state) => {
        setInstitutionState(state)
        setInstitutionStatus('connected')
      })
      .catch(() => {
        setInstitutionStatus('offline')
      })
  }

  useEffect(() => {
    if (!allNavItems.some((item) => item.id === activeNavId)) {
      setActiveNavId(allNavItems[0]?.id ?? 'academics')
    }
  }, [activeNavId, allNavItems])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeNavId])

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
    if (session?.id) {
      refreshInstitution()
    }
  }, [session?.id])

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
      setActiveNavId('home')
      setShowMoreTools(false)
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
        setActiveNavId('home')
        setShowMoreTools(false)
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
    setActiveNavId('home')
    setShowMoreTools(false)
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
            <strong>{institutionState.profile.shortName}</strong>
            <span>Powered by CampusOps AI</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary">
          {navItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Fragment key={item.id}>
                {index === 0 || navItems[index - 1].group !== item.group ? (
                  <span className="nav-group-label">{item.group}</span>
                ) : null}
                <button
                  type="button"
                  aria-label={item.label}
                  className={clsx('nav-item', activeNavId === item.id && 'is-active')}
                  onClick={() => setActiveNavId(item.id)}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              </Fragment>
            )
          })}
          {activeRole === 'admin' ? (
            <button
              type="button"
              className={clsx('nav-more-button', showMoreTools && 'is-open')}
              aria-expanded={showMoreTools}
              onClick={() => setShowMoreTools((current) => !current)}
            >
              <Settings2 size={16} />
              <span>{showMoreTools ? 'Hide extra tools' : 'More admin tools'}</span>
              <ChevronRight size={15} />
            </button>
          ) : null}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{sectionMeta.eyebrow}</span>
            <h1>{sectionMeta.title}</h1>
            <p className="topbar-copy">{sectionMeta.copy}</p>
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
          </div>
        </header>

        {activeNavId === 'home' ? (
          <div id="section-home" className="section-anchor active-section">
            <CampusHome
              currentRole={session.role}
              userName={session.name}
              state={institutionState}
              status={institutionStatus}
              onNavigate={setActiveNavId}
              onRefresh={refreshInstitution}
            />
          </div>
        ) : null}

        {activeNavId === 'academics' ? (
        <div id="section-academics" className="section-anchor active-section">
          <AcademicOperations
            currentRole={session.role}
            actorId={session.actorId}
            userName={session.name}
            onAuditEvent={appendAuditEvent}
          />
        </div>
        ) : null}

        {activeNavId === 'action-center' && activeRole !== 'student' ? (
          <div id="section-action-center" className="section-anchor active-section">
            <Suspense
              fallback={
                <div className="action-loading">
                  <Inbox size={18} />
                  <strong>Loading action center</strong>
                  <span>Preparing daily admin and faculty priorities.</span>
                </div>
              }
            >
              <ActionCenter
                currentRole={session.role}
                actorId={session.actorId}
                userName={session.name}
                onAuditEvent={appendAuditEvent}
                onNavigate={setActiveNavId}
              />
            </Suspense>
          </div>
        ) : null}

        {activeNavId === 'master-data' && activeRole !== 'student' ? (
          <div id="section-master-data" className="section-anchor active-section">
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

        {activeNavId === 'imports' && activeRole === 'admin' ? (
          <div id="section-imports" className="section-anchor active-section">
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

        {activeNavId === 'reports' && activeRole !== 'student' ? (
          <div id="section-reports" className="section-anchor active-section">
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

        {activeNavId === 'circulars' ? (
        <div id="section-circulars" className="section-anchor active-section">
          <CircularsCenter
            currentRole={session.role}
            actorId={session.actorId}
            userName={session.name}
            onAuditEvent={appendAuditEvent}
          />
        </div>
        ) : null}

        {activeNavId === 'staff' && activeRole !== 'student' ? (
          <div id="section-staff" className="section-anchor active-section">
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

        {activeNavId === 'automation-control' && activeRole === 'admin' ? (
          <div id="section-automation-control" className="section-anchor active-section">
            <Suspense
              fallback={
                <div className="automation-loading">
                  <PlugZap size={18} />
                  <strong>Loading automation controls</strong>
                  <span>Preparing rules, approvals, runs, and notifications.</span>
                </div>
              }
            >
              <AutomationCenter userName={session.name} onAuditEvent={appendAuditEvent} />
            </Suspense>
          </div>
        ) : null}

        {activeNavId === 'automation' ? (
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
        ) : null}

        {['knowledge', 'approvals', 'security'].includes(activeNavId) ? (
        <div
          className={clsx(
            'insight-grid',
            'single-section-grid',
            !showAdvancedAutomation && 'insight-grid--compact',
            !showApprovalPanel && 'insight-grid--student',
          )}
        >
          {activeNavId === 'knowledge' ? (
          <section id="section-knowledge" className="section-anchor active-section">
            <Suspense
              fallback={
                <div className="master-data-loading">
                  <BookOpenCheck size={18} />
                  <strong>Loading knowledge base</strong>
                  <span>Preparing policy documents and citations.</span>
                </div>
              }
            >
              <KnowledgeCenter
                currentRole={session.role}
                userName={session.name}
                onAuditEvent={appendAuditEvent}
              />
            </Suspense>
          </section>
          ) : null}

          {activeNavId === 'approvals' && showApprovalPanel ? (
          <section id="section-approvals" className="panel section-anchor active-section">
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

          {activeNavId === 'security' && showAdvancedAutomation ? (
          <section id="section-security" className="panel section-anchor active-section">
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
        ) : null}

        {activeNavId === 'audit' ? (
        <div className="bottom-grid bottom-grid--single">
          <section className="panel active-section">
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
        </div>
        ) : null}

        {activeNavId === 'evaluation' && showAdvancedAutomation ? (
        <div className="bottom-grid">
          <section id="section-evaluation" className="panel section-anchor active-section">
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

        {activeNavId === 'college-setup' && activeRole === 'admin' ? (
          <div id="section-college-setup" className="section-anchor active-section">
            <InstitutionSetup
              state={institutionState}
              onNavigate={setActiveNavId}
              onUpdated={(state) => {
                setInstitutionState(state)
                setInstitutionStatus('connected')
              }}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
