export type Role = 'student' | 'faculty' | 'admin'

export type RiskLevel = 'low' | 'medium' | 'high'

export type WorkflowStepKind =
  | 'intake'
  | 'rag'
  | 'policy'
  | 'approval'
  | 'tool'
  | 'notify'
  | 'complete'

export type WorkflowStepStatus = 'automated' | 'guarded' | 'human' | 'ready'

export type WorkflowStep = {
  id: string
  kind: WorkflowStepKind
  label: string
  description: string
  status: WorkflowStepStatus
}

export type WorkflowTemplate = {
  id: string
  title: string
  description: string
  owner: string
  sla: string
  risk: RiskLevel
  automationRate: number
  completionRate: number
  avgResolution: string
  tags: string[]
  keywords: string[]
  steps: WorkflowStep[]
}

export type KnowledgeDoc = {
  id: string
  title: string
  source: string
  freshness: string
  coverage: number
  tags: string[]
  summary: string
}

export type KnowledgeDocument = {
  id: string
  title: string
  source: string
  owner: string
  tags: string[]
  status: 'active' | 'archived'
  audience: 'everyone' | 'students' | 'faculty' | 'admin'
  versionLabel: string
  effectiveAt: string
  expiresAt: string
  pageCount: number
  format: 'text' | 'pdf'
  lifecycle: 'current' | 'scheduled' | 'expired' | 'archived'
  chunkCount: number
  createdAt: string
  updatedAt: string
}

export type KnowledgeState = {
  version: 2
  source: 'sqlite'
  documents: KnowledgeDocument[]
  stats: {
    documents: number
    activeDocuments: number
    chunks: number
    restrictedDocuments: number
    pdfDocuments: number
  }
}

export type KnowledgeCitation = {
  id: string
  documentId: string
  title: string
  source: string
  owner: string
  heading: string
  pageNumber: number
  content: string
  snippet: string
  tags: string[]
  score: number
  audience: 'everyone' | 'students' | 'faculty' | 'admin'
  versionLabel: string
  effectiveAt: string
  expiresAt: string
  format: 'text' | 'pdf'
  matchReasons: string[]
}

export type KnowledgeSearchPayload = {
  version: 2
  query: string
  answer: string
  citations: KnowledgeCitation[]
  confidence: number
  grounded: boolean
  retrievalMode: 'sqlite-fts5+concepts'
  warnings: string[]
}

export type KnowledgeEvaluationCase = {
  id: string
  question: string
  expectedDocumentId: string
  expectedTerm: string
  citationCorrect: boolean
  answerSupported: boolean
  passed: boolean
  confidence: number
  retrievedDocument: string
}

export type KnowledgeEvaluationPayload = {
  version: 1
  generatedAt: string
  retrievalMode: 'sqlite-fts5+concepts'
  total: number
  passed: number
  accuracy: number
  citationAccuracy: number
  answerSupport: number
  durationMs: number
  cases: KnowledgeEvaluationCase[]
}

export type ApprovalStatus = 'pending' | 'approved' | 'blocked'

export type ApprovalItem = {
  id: string
  title: string
  requester: string
  role: Role
  workflowId: string
  risk: RiskLevel
  amount?: string
  status: ApprovalStatus
  due: string
}

export type AuditEvent = {
  id: string
  time: string
  actor: string
  action: string
  outcome: string
  severity: 'info' | 'success' | 'warning' | 'critical'
}

export type UserAccount = {
  id: string
  role: Role
  name: string
  title: string
  email: string
  actorId: string
  summary: string
  status?: 'active' | 'inactive'
}

export type AuthSession = {
  token: string
  user: UserAccount
}

export type InstitutionProfile = {
  name: string
  shortName: string
  code: string
  academicYear: string
  currentTerm: string
  timezone: string
  attendanceThreshold: number
  emailDomain: string
  website: string
  updatedAt: string
}

export type InstitutionReadinessStep = {
  id: string
  label: string
  detail: string
  complete: boolean
  targetSection: string
}

export type InstitutionState = {
  version: 1
  source: 'sqlite' | 'demo'
  profile: InstitutionProfile
  readiness: {
    score: number
    completed: number
    total: number
    steps: InstitutionReadinessStep[]
  }
  stats: {
    departments: number
    subjects: number
    students: number
    staff: number
    classSections: number
    timetableSlots: number
    attendanceRecords: number
    pendingLeaves: number
    circulars: number
    knowledgeDocuments: number
  }
  dashboard: {
    attendancePercent: number | null
    scheduledPeriods: number
    pendingLeaves: number
    unreadCirculars: number
    openActions: number
    criticalActions: number
    attendanceGaps: number
  }
}

export type RequestCase = {
  id: string
  title: string
  requester: string
  role: Role
  workflowId: string
  status: string
  eta: string
  priority: RiskLevel
}

export type EvaluationMetric = {
  label: string
  value: number
  target: number
  unit: string
  trend: string
}

export type SecurityControl = {
  id: string
  title: string
  status: 'active' | 'review' | 'blocked'
  risk: RiskLevel
  mappedRisk: string
  signal: string
}

export type Integration = {
  id: string
  title: string
  type: string
  cost: string
  status: 'ready' | 'sandbox' | 'optional'
}

export type RouteResult = {
  workflowId: string
  confidence: number
  summary: string
  routeReason: string
  requiredApproval: boolean
  retrievedDocs: KnowledgeDoc[]
  safety: {
    level: RiskLevel
    verdict: string
    flags: string[]
  }
  plan: string[]
  trace: AuditEvent[]
}

export type AcademicDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'pending_leave'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type ClassSection = {
  id: string
  name: string
  program: string
  semester: number
  advisorId: string
  room: string
}

export type Student = {
  id: string
  rollNo: string
  name: string
  classSectionId: string
  email: string
}

export type Teacher = {
  id: string
  name: string
  department: string
  email: string
}

export type Subject = {
  id: string
  code: string
  name: string
  department: string
}

export type MasterDataStatus = 'active' | 'inactive'

export type SubjectKind = 'theory' | 'lab' | 'elective'

export type MasterDepartment = {
  id: string
  name: string
  code: string
  facultyInCharge: string
  officeRoom: string
  status: MasterDataStatus
}

export type MasterSubject = {
  id: string
  departmentId: string
  semester: number
  code: string
  name: string
  credits: number
  kind: SubjectKind
  defaultFaculty: string
  status: MasterDataStatus
}

export type TimetableSlot = {
  id: string
  classSectionId: string
  day: AcademicDay
  periodNumber: number
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  room: string
}

export type AttendanceRecord = {
  id: string
  slotId: string
  studentId: string
  date: string
  status: AttendanceStatus
  markedBy: string
  updatedAt: string
}

export type LeaveRequest = {
  id: string
  studentId: string
  slotId: string
  date: string
  reason: string
  status: LeaveStatus
  reviewerId: string
  createdAt: string
}

export type CircularPriority = 'normal' | 'important' | 'urgent'

export type CircularAudience =
  | {
      type: 'everyone' | 'students' | 'faculty'
    }
  | {
      type: 'class'
      classSectionId: string
    }
  | {
      type: 'department'
      department: string
    }

export type Circular = {
  id: string
  title: string
  body: string
  priority: CircularPriority
  audience: CircularAudience
  publishedAt: string
  expiresAt?: string
  attachmentName?: string
  createdBy: string
}

export type CircularReadReceipt = {
  circularId: string
  actorId: string
  readAt: string
}

export type CircularState = {
  version: 1
  circulars: Circular[]
  readReceipts: CircularReadReceipt[]
}

export type CircularIntelligenceCitation = {
  id: string
  title: string
  priority: CircularPriority
  audience: string
  publishedAt: string
  expiresAt: string
  deadline: string
  active: boolean
  read: boolean
  snippet: string
  attachmentName: string
  score: number
}

export type CircularDeadlineInsight = {
  id: string
  title: string
  priority: CircularPriority
  audience: string
  expiresAt: string
  deadline: string
}

export type CircularIntelligencePayload = {
  version: 1
  source: 'sqlite'
  query: string
  generatedAt: string
  answer: string
  stats: {
    visible: number
    active: number
    unread: number
    urgent: number
    deadlines: number
  }
  citations: CircularIntelligenceCitation[]
  deadlines: CircularDeadlineInsight[]
}

export type StaffStatus = 'active' | 'on_leave' | 'inactive'

export type StaffProfile = {
  id: string
  teacherId: string
  employeeCode: string
  name: string
  department: string
  designation: string
  email: string
  phone: string
  status: StaffStatus
  joinedAt: string
  officeRoom: string
}

export type StaffState = {
  version: 1
  staffProfiles: StaffProfile[]
}

export type ReportFilters = {
  department: string
  semester: string
  date: string
  status: string
  role: Role
  actorId: string
}

export type AttendanceShortageReportRow = {
  studentId: string
  rollNo: string
  studentName: string
  className: string
  semester: number
  department: string
  totalMarked: number
  attended: number
  missed: number
  lastMarkedDate: string
  status: 'shortage'
  attendancePercent: number
}

export type PendingLeaveReportRow = {
  id: string
  studentName: string
  rollNo: string
  className: string
  semester: number
  department: string
  subjectName: string
  date: string
  periodNumber: number
  reviewerName: string
  reason: string
  status: LeaveStatus
  createdAt: string
}

export type FacultyWorkloadReportRow = {
  teacherId: string
  employeeCode: string
  teacherName: string
  department: string
  designation: string
  staffStatus: StaffStatus
  assignedSlots: number
  uniqueSubjects: number
  classSections: number
  loadStatus: 'normal' | 'overloaded'
}

export type DepartmentSubjectCoverageReportRow = {
  departmentId: string
  departmentName: string
  departmentCode: string
  semester: number
  totalSubjects: number
  mappedSubjects: number
  unmappedSubjects: number
  unmappedSubjectCodes: string
  coveragePercent: number
  status: 'covered' | 'unmapped'
}

export type InactiveMasterDataReportRow = {
  id: string
  type: 'Department' | 'Subject'
  name: string
  code: string
  owner: string
  status: 'inactive'
  detail: string
}

export type CircularEngagementReportRow = {
  id: string
  title: string
  priority: CircularPriority
  audience: string
  publishedAt: string
  active: boolean
  targetCount: number
  readCount: number
  unreadCount: number
  readRate: number
  status: 'read' | 'unread'
}

export type DailyOperationsSummary = {
  date: string
  markedAttendanceCount: number
  presentCount: number
  absentCount: number
  pendingLeaveAttendanceCount: number
  pendingLeaveRequests: number
  activeCirculars: number
  unreadCircularReceipts: number
  activeDepartments: number
  activeSubjects: number
}

export type ActionSeverity = 'critical' | 'warning' | 'info' | 'success'

export type ActionCategory =
  | 'Attendance'
  | 'Leave'
  | 'Workload'
  | 'Mapping'
  | 'Master data'
  | 'Circulars'

export type ActionTargetSection =
  | 'academics'
  | 'reports'
  | 'circulars'
  | 'staff'
  | 'master-data'
  | 'imports'

export type ActionCenterItem = {
  id: string
  category: ActionCategory
  severity: ActionSeverity
  title: string
  detail: string
  owner: string
  dueDate: string
  source: string
  targetSection: ActionTargetSection
  actionLabel: string
  status: 'open'
  metricLabel: string
  metricValue: string | number
}

export type ActionCenterPayload = {
  version: 1
  source: 'sqlite'
  generatedAt: string
  filters: ReportFilters
  filterOptions: {
    departments: string[]
    semesters: number[]
    dates: string[]
    categories: ActionCategory[]
    severities: Array<'all' | ActionSeverity>
  }
  summary: {
    total: number
    critical: number
    warning: number
    info: number
    attendanceGaps: number
    pendingLeaves: number
    shortageStudents: number
    overloadedFaculty: number
    coverageGaps: number
    inactiveRecords: number
    circularsWithUnread: number
  }
  categories: Array<{
    label: ActionCategory
    count: number
  }>
  items: ActionCenterItem[]
}

export type AutomationRunStatus =
  | 'completed'
  | 'awaiting_approval'
  | 'rejected'
  | 'no_match'
  | 'failed'

export type AutomationRun = {
  id: string
  ruleId: string
  ruleName: string
  category: string
  status: AutomationRunStatus
  matchCount: number
  notificationCount: number
  attempt: number
  summary: string
  errorMessage: string
  startedBy: string
  decidedBy: string
  decidedAt: string
  startedAt: string
  completedAt: string
  deduplicated?: boolean
}

export type AutomationRule = {
  id: string
  name: string
  description: string
  category: string
  triggerType:
    | 'attendance_gap'
    | 'pending_leave'
    | 'attendance_shortage'
    | 'circular_unread'
    | 'policy_expiry'
  condition: {
    minimumSeverity?: 'info' | 'warning' | 'critical'
    daysBefore?: number
  }
  action: {
    type: 'in_app_notification'
    target: 'signal_owner'
  }
  approvalRequired: boolean
  enabled: boolean
  cooldownMinutes: number
  createdBy: string
  createdAt: string
  updatedAt: string
  lastRun: AutomationRun | null
}

export type AutomationNotification = {
  id: string
  runId: string
  ruleName: string
  recipient: string
  channel: 'in_app'
  subject: string
  message: string
  status: 'sent' | 'read' | 'failed'
  createdAt: string
  sentAt: string
  readAt: string
}

export type AutomationState = {
  version: 1
  source: 'sqlite'
  generatedAt: string
  summary: {
    rules: number
    enabledRules: number
    runsToday: number
    completedRuns: number
    awaitingApproval: number
    failedRuns: number
    unreadNotifications: number
  }
  rules: AutomationRule[]
  runs: AutomationRun[]
  notifications: AutomationNotification[]
}

export type ReportsPayload = {
  version: 1
  source: 'sqlite'
  generatedAt: string
  attendanceThreshold: number
  filters: ReportFilters
  filterOptions: {
    departments: string[]
    semesters: number[]
    dates: string[]
    statuses: string[]
  }
  kpis: {
    attendanceShortage: number
    pendingLeaves: number
    overloadedFaculty: number
    unmappedCoverageRows: number
    inactiveRecords: number
    unreadCirculars: number
    markedAttendanceToday: number
  }
  attendanceShortage: AttendanceShortageReportRow[]
  pendingLeave: PendingLeaveReportRow[]
  facultyWorkload: FacultyWorkloadReportRow[]
  departmentSubjectCoverage: DepartmentSubjectCoverageReportRow[]
  inactiveMasterData: InactiveMasterDataReportRow[]
  circularEngagement: CircularEngagementReportRow[]
  dailySummary: DailyOperationsSummary
}

export type ImportKind = 'students' | 'staff' | 'subjects' | 'timetable'

export type ImportCellValue = string | number | boolean | null | undefined

export type ImportSourceRow = Record<string, ImportCellValue>

export type ImportPreviewRow = {
  rowNumber: number
  data: ImportSourceRow
  errors: string[]
  conflicts: string[]
  action: 'create' | 'update'
  normalized: ImportSourceRow
}

export type ImportPreviewPayload = {
  version: 1
  kind: ImportKind
  totalRows: number
  validRows: ImportPreviewRow[]
  invalidRows: ImportPreviewRow[]
  summary: {
    valid: number
    invalid: number
    creates: number
    updates: number
    conflicts: number
  }
}

export type ImportCommitPayload = ImportPreviewPayload & {
  importedRows: number
  auditEvent: AuditEvent
}
