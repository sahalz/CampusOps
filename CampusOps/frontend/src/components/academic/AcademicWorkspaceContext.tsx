import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { TimetableDraft } from '../../lib/academic'
import type {
  AcademicDay,
  AttendanceRecord,
  AttendanceStatus,
  ClassSection,
  LeaveRequest,
  LeaveStatus,
  Role,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
} from '../../types'

export type OperationNotice = {
  tone: 'success' | 'warning' | 'info'
  title: string
  message: string
}

export type ImportType = 'students' | 'teachers' | 'subjects' | 'sections' | 'timetable'

export type ImportPreview = {
  validCount: number
  errors: string[]
  warnings: string[]
}

export type DailyRole = 'admin' | 'teacher' | 'student'

export type SetupStep = {
  label: string
  complete: boolean
  detail: string
}

export type AttendanceSummary = {
  present: number
  absent: number
  excused: number
  pendingLeave: number
  unmarked: number
}

export type AcademicStats = {
  sections: number
  totalStudents: number
  mappedSlots: number
  pendingLeaves: number
  todayMarked: number
  busiestTeacher: {
    teacher: Teacher
    count: number
  }
}

export type RoleHero = {
  kicker: string
  title: string
  copy: string
}

export type AcademicWorkspaceValue = {
  currentRole: Role
  actorId: string
  isAdmin: boolean
  isFaculty: boolean
  isStudent: boolean
  canManageSetup: boolean
  canManageImports: boolean
  canMapTimetable: boolean
  canMarkAttendance: boolean
  canApproveLeave: boolean
  canApplyLeave: boolean
  classSections: ClassSection[]
  students: Student[]
  teachers: Teacher[]
  subjects: Subject[]
  slots: TimetableSlot[]
  attendance: AttendanceRecord[]
  leaves: LeaveRequest[]
  teacherById: Map<string, Teacher>
  subjectById: Map<string, Subject>
  sectionById: Map<string, ClassSection>
  studentById: Map<string, Student>
  currentTeacher?: Teacher
  availableDailyRoles: readonly DailyRole[]
  availableClassSections: ClassSection[]
  sectionStudents: Student[]
  visibleSectionStudents: Student[]
  daySlots: TimetableSlot[]
  visibleSlots: TimetableSlot[]
  selectedSlot?: TimetableSlot
  selectedStudent: Student
  selectedStudentSlots: TimetableSlot[]
  selectedSlotSummary: AttendanceSummary
  mappedStats: AcademicStats
  setupSteps: SetupStep[]
  setupProgress: number
  focusedTeacher?: Teacher
  teacherDaySlots: TimetableSlot[]
  studentDaySlots: TimetableSlot[]
  importLabels: Record<ImportType, string>
  importSamples: Record<ImportType, string>
  importType: ImportType
  importText: string
  importPreview: ImportPreview
  studentAttendancePercent: number
  reviewableLeaves: LeaveRequest[]
  canSubmitLeave: boolean
  notice: OperationNotice
  academicSyncStatus: 'checking' | 'connected' | 'offline'
  academicSyncMessage: string
  roleHero: RoleHero
  conflicts: string[]
  draft: TimetableDraft
  activeDailyRole: DailyRole
  selectedClassId: string
  selectedDay: AcademicDay
  selectedDate: string
  selectedSlotId: string
  selectedStudentId: string
  studentLeaveSlotId: string
  studentSearch: string
  leaveReason: string
  setActiveDailyRole: Dispatch<SetStateAction<DailyRole>>
  setImportType: Dispatch<SetStateAction<ImportType>>
  setImportText: Dispatch<SetStateAction<string>>
  setDraft: Dispatch<SetStateAction<TimetableDraft>>
  setSelectedClassId: Dispatch<SetStateAction<string>>
  setSelectedDay: Dispatch<SetStateAction<AcademicDay>>
  setSelectedDate: Dispatch<SetStateAction<string>>
  setSelectedSlotId: Dispatch<SetStateAction<string>>
  setSelectedStudentId: Dispatch<SetStateAction<string>>
  setStudentLeaveSlotId: Dispatch<SetStateAction<string>>
  setStudentSearch: Dispatch<SetStateAction<string>>
  setLeaveReason: Dispatch<SetStateAction<string>>
  notify: (tone: OperationNotice['tone'], title: string, message: string) => void
  applyImport: () => void
  applyDraftPeriod: (periodNumber: number) => void
  useClassRoom: () => void
  useFirstFreePeriod: () => void
  updateDraftClass: (classSectionId: string) => void
  updateDraftSubject: (subjectId: string) => void
  mapSlot: () => void
  markAttendance: (studentId: string, status: AttendanceStatus) => void
  markUnmarkedPresent: () => void
  submitLeave: () => void
  resetAcademicData: () => void
  resolveLeave: (leaveId: string, status: LeaveStatus) => void
  approveNextPendingLeave: () => void
  validateSetup: () => void
  formatSlot: (slot: TimetableSlot) => string
}

export const AcademicWorkspaceContext = createContext<AcademicWorkspaceValue | null>(null)

export function useAcademicWorkspace() {
  const context = useContext(AcademicWorkspaceContext)

  if (!context) {
    throw new Error('useAcademicWorkspace must be used within AcademicWorkspaceProvider')
  }

  return context
}
