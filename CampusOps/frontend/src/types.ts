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
