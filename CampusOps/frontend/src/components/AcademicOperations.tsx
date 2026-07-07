import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  academicDays,
  attendanceRecords as seededAttendance,
  classSections as seededClassSections,
  leaveRequests as seededLeaves,
  students as seededStudents,
  subjects as seededSubjects,
  teachers as seededTeachers,
  timetableSlots as seededSlots,
} from '../data/academic'
import {
  calculateStudentAttendancePercent,
  detectTimetableConflicts,
  getAttendanceForSlot,
  getLeaveForSlot,
  getSectionStudents,
  statusLabel,
  summarizeAttendance,
  upsertAttendanceRecord,
  type TimetableDraft,
} from '../lib/academic'
import {
  fetchAcademicState,
  resetAcademicStateOnServer,
  saveAcademicStateOnServer,
  type AcademicState,
} from '../lib/api'
import type {
  AcademicDay,
  AttendanceRecord,
  AttendanceStatus,
  AuditEvent,
  ClassSection,
  LeaveRequest,
  LeaveStatus,
  Role,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
} from '../types'
import {
  AcademicWorkspaceContext,
  type DailyRole,
  type ImportPreview,
  type ImportType,
  type OperationNotice,
} from './academic/AcademicWorkspaceContext'

const AdminAcademicWorkspace = lazy(() =>
  import('./academic/AdminAcademicWorkspace').then((module) => ({ default: module.AdminAcademicWorkspace })),
)
const FacultyAcademicWorkspace = lazy(() =>
  import('./academic/FacultyAcademicWorkspace').then((module) => ({ default: module.FacultyAcademicWorkspace })),
)
const StudentAcademicWorkspace = lazy(() =>
  import('./academic/StudentAcademicWorkspace').then((module) => ({ default: module.StudentAcademicWorkspace })),
)

type AcademicOperationsProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent) => void
}

const importLabels: Record<ImportType, string> = {
  students: 'Students',
  teachers: 'Teachers',
  subjects: 'Subjects',
  sections: 'Classes',
  timetable: 'Timetable',
}

const importSamples: Record<ImportType, string> = {
  students:
    'rollNo,name,class,email\nCSE5A05,Irfan Qureshi,CSE-A,irfan.qureshi@campus.edu\nCSE5A06,Tara Bose,CSE-A,tara.bose@campus.edu',
  teachers:
    'name,department,email\nProf. Ramesh Kumar,Computer Science,ramesh.kumar@campus.edu\nProf. Latha N,Mathematics,latha.n@campus.edu',
  subjects:
    'code,name,department\nCS504,Operating Systems,Computer Science\nMA506,Probability and Statistics,Mathematics',
  sections:
    'name,program,semester,advisor,room\nCSE-C,B.Tech CSE,5,Prof. Anjali Rao,B-206\nAIML-A,B.Tech AIML,3,Prof. Vikram Menon,A-101',
  timetable:
    'class,day,period,start,end,subject,teacher,room\nCSE-A,Tuesday,2,10:00,11:00,CS503,Prof. Anjali Rao,AI Lab\nCSE-B,Tuesday,2,10:00,11:00,CS502,Prof. Vikram Menon,B-205',
}

const today = '2026-07-06'
const storageKey = 'campusops-academic-state-v2'

const periodTimes = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
]

const defaultDraft: TimetableDraft = {
  classSectionId: seededClassSections[0].id,
  day: 'Monday',
  periodNumber: 4,
  startTime: '13:00',
  endTime: '14:00',
  subjectId: seededSubjects[2].id,
  teacherId: seededTeachers[0].id,
  room: 'B-204',
}

type StoredAcademicState = AcademicState

function readStoredAcademicState(): StoredAcademicState | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredAcademicState>
    if (
      parsed.version !== 2 ||
      !Array.isArray(parsed.classSections) ||
      !Array.isArray(parsed.students) ||
      !Array.isArray(parsed.teachers) ||
      !Array.isArray(parsed.subjects) ||
      !Array.isArray(parsed.slots) ||
      !Array.isArray(parsed.attendance) ||
      !Array.isArray(parsed.leaves)
    ) {
      return null
    }

    return parsed as StoredAcademicState
  } catch {
    return null
  }
}

function writeStoredAcademicState(state: StoredAcademicState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Storage can fail in private mode; the app should keep running with in-memory state.
  }
}

function makeReadableId(prefix: string) {
  const uniquePart = Date.now().toString(36).toUpperCase()
  return `${prefix}-${uniquePart}`
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseCsvRows(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    return []
  }

  return lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()))
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

function formatSlot(slot: TimetableSlot) {
  return `P${slot.periodNumber} / ${slot.startTime}-${slot.endTime}`
}

const dailyRoleForAccount = (role: Role): DailyRole => {
  if (role === 'admin') {
    return 'admin'
  }
  if (role === 'faculty') {
    return 'teacher'
  }
  return 'student'
}

export function AcademicOperations({ currentRole, actorId, userName, onAuditEvent }: AcademicOperationsProps) {
  const [storedState] = useState(() => readStoredAcademicState())
  const [classSections, setClassSections] = useState<ClassSection[]>(
    () => storedState?.classSections ?? seededClassSections,
  )
  const [students, setStudents] = useState<Student[]>(() => storedState?.students ?? seededStudents)
  const [teachers, setTeachers] = useState<Teacher[]>(() => storedState?.teachers ?? seededTeachers)
  const [subjects, setSubjects] = useState<Subject[]>(() => storedState?.subjects ?? seededSubjects)
  const [slots, setSlots] = useState<TimetableSlot[]>(() => storedState?.slots ?? seededSlots)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storedState?.attendance ?? seededAttendance)
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => storedState?.leaves ?? seededLeaves)
  const [selectedClassId, setSelectedClassId] = useState(seededClassSections[0].id)
  const [selectedDay, setSelectedDay] = useState<AcademicDay>('Monday')
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedSlotId, setSelectedSlotId] = useState(seededSlots[0].id)
  const [selectedStudentId, setSelectedStudentId] = useState(seededStudents[0].id)
  const [studentLeaveSlotId, setStudentLeaveSlotId] = useState(seededSlots[1].id)
  const [studentSearch, setStudentSearch] = useState('')
  const [leaveReason, setLeaveReason] = useState('Medical appointment during the selected hour.')
  const [draft, setDraft] = useState<TimetableDraft>(defaultDraft)
  const [notice, setNotice] = useState<OperationNotice>({
    tone: 'info',
    title: 'Academic register ready',
    message: 'Timetable, attendance, and leave records are loaded from the verified local workspace.',
  })
  const [activeDailyRole, setActiveDailyRole] = useState<DailyRole>(() =>
    dailyRoleForAccount(currentRole),
  )
  const [importType, setImportType] = useState<ImportType>('students')
  const [importText, setImportText] = useState(importSamples.students)
  const [academicSyncStatus, setAcademicSyncStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [academicSyncMessage, setAcademicSyncMessage] = useState('Checking SQLite academic backend.')
  const [academicBackendReady, setAcademicBackendReady] = useState(false)

  const teacherById = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers])
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const sectionById = useMemo(() => new Map(classSections.map((section) => [section.id, section])), [classSections])
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const isAdmin = currentRole === 'admin'
  const isFaculty = currentRole === 'faculty'
  const isStudent = currentRole === 'student'
  const canManageSetup = isAdmin
  const canManageImports = isAdmin
  const canMapTimetable = isAdmin
  const canMarkAttendance = isAdmin || isFaculty
  const canApproveLeave = isAdmin || isFaculty
  const canApplyLeave = isAdmin || isStudent
  const currentTeacher = teacherById.get(actorId)
  const currentStudent = studentById.get(actorId)

  const availableDailyRoles = useMemo(() => {
    if (isAdmin) {
      return ['admin', 'teacher', 'student'] as const
    }
    if (isFaculty) {
      return ['teacher'] as const
    }
    return ['student'] as const
  }, [isAdmin, isFaculty])

  const availableClassSections = useMemo(() => {
    if (isStudent && currentStudent) {
      return classSections.filter((section) => section.id === currentStudent.classSectionId)
    }

    if (isFaculty) {
      const assignedSectionIds = new Set(
        slots.filter((slot) => slot.teacherId === actorId).map((slot) => slot.classSectionId),
      )
      return classSections.filter((section) => assignedSectionIds.has(section.id))
    }

    return classSections
  }, [actorId, classSections, currentStudent, isFaculty, isStudent, slots])

  const sectionStudents = useMemo(() => getSectionStudents(students, selectedClassId), [selectedClassId, students])
  const visibleSectionStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()

    if (!query) {
      return sectionStudents
    }

    return sectionStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.rollNo.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query),
    )
  }, [sectionStudents, studentSearch])

  const daySlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.classSectionId === selectedClassId && slot.day === selectedDay)
        .filter((slot) => !isFaculty || slot.teacherId === actorId)
        .sort((first, second) => first.periodNumber - second.periodNumber),
    [actorId, isFaculty, selectedClassId, selectedDay, slots],
  )

  const visibleSlots = useMemo(() => {
    if (isFaculty) {
      return slots.filter((slot) => slot.teacherId === actorId)
    }

    if (isStudent && currentStudent) {
      return slots.filter((slot) => slot.classSectionId === currentStudent.classSectionId)
    }

    return slots
  }, [actorId, currentStudent, isFaculty, isStudent, slots])

  const selectedSlot = useMemo(() => {
    const current = daySlots.find((slot) => slot.id === selectedSlotId)
    return current ?? daySlots[0] ?? (isAdmin ? slots[0] : undefined)
  }, [daySlots, isAdmin, selectedSlotId, slots])

  const selectedStudent = studentById.get(selectedStudentId) ?? students[0] ?? seededStudents[0]
  const selectedStudentSlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.classSectionId === selectedStudent.classSectionId && slot.day === selectedDay)
        .sort((first, second) => first.periodNumber - second.periodNumber),
    [selectedDay, selectedStudent.classSectionId, slots],
  )

  useEffect(() => {
    writeStoredAcademicState({
      version: 2,
      classSections,
      students,
      teachers,
      subjects,
      slots,
      attendance,
      leaves,
    })
  }, [attendance, classSections, leaves, slots, students, subjects, teachers])

  useEffect(() => {
    let mounted = true

    fetchAcademicState()
      .then((state) => {
        if (!mounted) {
          return
        }

        setClassSections(state.classSections)
        setStudents(state.students)
        setTeachers(state.teachers)
        setSubjects(state.subjects)
        setSlots(state.slots)
        setAttendance(state.attendance)
        setLeaves(state.leaves)
        setSelectedClassId(state.classSections[0]?.id ?? seededClassSections[0].id)
        setSelectedSlotId(state.slots[0]?.id ?? seededSlots[0].id)
        setSelectedStudentId(state.students[0]?.id ?? seededStudents[0].id)
        setStudentLeaveSlotId(state.slots[1]?.id ?? state.slots[0]?.id ?? '')
        setAcademicSyncStatus('connected')
        setAcademicSyncMessage('SQLite academic backend connected.')
        setAcademicBackendReady(true)
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setAcademicSyncStatus('offline')
        setAcademicSyncMessage('Backend offline; using browser backup.')
        setAcademicBackendReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!academicBackendReady || academicSyncStatus !== 'connected') {
      return
    }

    const state: AcademicState = {
      version: 2,
      classSections,
      students,
      teachers,
      subjects,
      slots,
      attendance,
      leaves,
    }

    const timeout = window.setTimeout(() => {
      saveAcademicStateOnServer(state)
        .then(() => {
          setAcademicSyncMessage('Academic changes saved to SQLite.')
        })
        .catch(() => {
          setAcademicSyncStatus('offline')
          setAcademicSyncMessage('Backend save failed; browser backup is active.')
        })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [academicBackendReady, academicSyncStatus, attendance, classSections, leaves, slots, students, subjects, teachers])

  useEffect(() => {
    setActiveDailyRole(dailyRoleForAccount(currentRole))
  }, [currentRole])

  useEffect(() => {
    const firstAvailableSection = availableClassSections[0]

    if (firstAvailableSection && !availableClassSections.some((section) => section.id === selectedClassId)) {
      setSelectedClassId(firstAvailableSection.id)
    }

    if (isStudent && currentStudent && selectedStudentId !== currentStudent.id) {
      setSelectedStudentId(currentStudent.id)
    }
  }, [availableClassSections, currentStudent, isStudent, selectedClassId, selectedStudentId])

  useEffect(() => {
    if (daySlots.length === 0) {
      return
    }

    if (!daySlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(daySlots[0].id)
    }
  }, [daySlots, selectedSlotId])

  useEffect(() => {
    if (selectedStudentSlots.length === 0) {
      return
    }

    if (!selectedStudentSlots.some((slot) => slot.id === studentLeaveSlotId)) {
      setStudentLeaveSlotId(selectedStudentSlots[0].id)
    }
  }, [selectedStudentSlots, studentLeaveSlotId])

  const conflicts = useMemo(
    () => (canMapTimetable ? detectTimetableConflicts(draft, slots, teachers, subjects, classSections) : []),
    [canMapTimetable, classSections, draft, slots, subjects, teachers],
  )

  const selectedSlotSummary = useMemo(() => {
    if (!selectedSlot) {
      return {
        present: 0,
        absent: 0,
        excused: 0,
        pendingLeave: 0,
        unmarked: 0,
      }
    }

    return summarizeAttendance(attendance, leaves, selectedSlot.id, selectedDate, sectionStudents)
  }, [attendance, leaves, sectionStudents, selectedDate, selectedSlot])

  const mappedStats = useMemo(() => {
    const totalStudents = students.length
    const pendingLeaves = leaves.filter((leave) => leave.status === 'pending').length
    const todayMarked = attendance.filter((record) => record.date === selectedDate).length
    const teacherLoad = teachers.map((teacher) => ({
      teacher,
      count: slots.filter((slot) => slot.teacherId === teacher.id).length,
    }))
    const busiestTeacher = teacherLoad.sort((first, second) => second.count - first.count)[0]

    return {
      sections: classSections.length,
      totalStudents,
      mappedSlots: slots.length,
      pendingLeaves,
      todayMarked,
      busiestTeacher,
    }
  }, [attendance, classSections.length, leaves, selectedDate, slots, students.length, teachers])

  const setupSteps = useMemo(
    () => [
      {
        label: 'Classes',
        complete: classSections.length > 0,
        detail: `${classSections.length} sections ready`,
      },
      {
        label: 'Teachers',
        complete: teachers.length > 0,
        detail: `${teachers.length} teachers ready`,
      },
      {
        label: 'Subjects',
        complete: subjects.length > 0,
        detail: `${subjects.length} subjects ready`,
      },
      {
        label: 'Students',
        complete: students.length > 0,
        detail: `${students.length} students assigned`,
      },
      {
        label: 'Timetable',
        complete: slots.length > 0,
        detail: `${slots.length} slots mapped`,
      },
    ],
    [classSections.length, slots.length, students.length, subjects.length, teachers.length],
  )
  const setupProgress = Math.round(
    (setupSteps.filter((step) => step.complete).length / setupSteps.length) * 100,
  )

  const focusedTeacher = isFaculty ? currentTeacher ?? teachers[0] : teacherById.get(selectedSlot?.teacherId ?? '') ?? teachers[0]
  const teacherDaySlots = useMemo(
    () =>
      focusedTeacher
        ? slots
            .filter((slot) => slot.teacherId === focusedTeacher.id && slot.day === selectedDay)
            .sort((first, second) => first.periodNumber - second.periodNumber)
        : [],
    [focusedTeacher, selectedDay, slots],
  )
  const studentDaySlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.classSectionId === selectedStudent.classSectionId && slot.day === selectedDay)
        .sort((first, second) => first.periodNumber - second.periodNumber),
    [selectedDay, selectedStudent.classSectionId, slots],
  )

  const importPreview = useMemo<ImportPreview>(() => {
    if (!canManageImports) {
      return {
        validCount: 0,
        errors: [],
        warnings: [],
      }
    }

    const rows = parseCsvRows(importText)
    const errors: string[] = []
    const warnings: string[] = []
    let validCount = 0
    const stagedSlots: TimetableSlot[] = [...slots]

    if (rows.length === 0) {
      return {
        validCount: 0,
        errors: ['Paste CSV with a header row and at least one data row.'],
        warnings: [],
      }
    }

    rows.forEach((row, index) => {
      const rowNumber = index + 2

      if (importType === 'students') {
        const [rollNo, name, className, email] = row
        const section = classSections.find((item) => item.name.toLowerCase() === className?.toLowerCase())
        if (!rollNo || !name || !className || !email) {
          errors.push(`Row ${rowNumber}: rollNo, name, class, and email are required.`)
          return
        }
        if (!section) {
          errors.push(`Row ${rowNumber}: class ${className} does not exist yet.`)
          return
        }
        if (students.some((student) => student.rollNo.toLowerCase() === rollNo.toLowerCase())) {
          warnings.push(`Row ${rowNumber}: ${rollNo} already exists and will be skipped.`)
          return
        }
        validCount += 1
      }

      if (importType === 'teachers') {
        const [name, department, email] = row
        if (!name || !department || !email) {
          errors.push(`Row ${rowNumber}: name, department, and email are required.`)
          return
        }
        if (teachers.some((teacher) => teacher.email.toLowerCase() === email.toLowerCase())) {
          warnings.push(`Row ${rowNumber}: ${email} already exists and will be skipped.`)
          return
        }
        validCount += 1
      }

      if (importType === 'subjects') {
        const [code, name, department] = row
        if (!code || !name || !department) {
          errors.push(`Row ${rowNumber}: code, name, and department are required.`)
          return
        }
        if (subjects.some((subject) => subject.code.toLowerCase() === code.toLowerCase())) {
          warnings.push(`Row ${rowNumber}: ${code} already exists and will be skipped.`)
          return
        }
        validCount += 1
      }

      if (importType === 'sections') {
        const [name, program, semester, advisor, room] = row
        const teacher = teachers.find(
          (item) =>
            item.name.toLowerCase() === advisor?.toLowerCase() ||
            item.email.toLowerCase() === advisor?.toLowerCase(),
        )
        if (!name || !program || !semester || !advisor || !room) {
          errors.push(`Row ${rowNumber}: name, program, semester, advisor, and room are required.`)
          return
        }
        if (!teacher) {
          errors.push(`Row ${rowNumber}: advisor ${advisor} does not match a teacher.`)
          return
        }
        if (classSections.some((section) => section.name.toLowerCase() === name.toLowerCase())) {
          warnings.push(`Row ${rowNumber}: ${name} already exists and will be skipped.`)
          return
        }
        validCount += 1
      }

      if (importType === 'timetable') {
        const [className, day, period, startTime, endTime, subjectValue, teacherValue, room] = row
        const section = classSections.find((item) => item.name.toLowerCase() === className?.toLowerCase())
        const subject = subjects.find(
          (item) =>
            item.code.toLowerCase() === subjectValue?.toLowerCase() ||
            item.name.toLowerCase() === subjectValue?.toLowerCase(),
        )
        const teacher = teachers.find(
          (item) =>
            item.name.toLowerCase() === teacherValue?.toLowerCase() ||
            item.email.toLowerCase() === teacherValue?.toLowerCase(),
        )
        const academicDay = academicDays.find((item) => item.toLowerCase() === day?.toLowerCase())
        const periodNumber = Number(period)

        if (!section || !subject || !teacher || !academicDay || !periodNumber || !startTime || !endTime || !room) {
          errors.push(`Row ${rowNumber}: class, day, period, time, subject, teacher, and room must match setup data.`)
          return
        }

        const draftSlot: TimetableDraft = {
          classSectionId: section.id,
          day: academicDay,
          periodNumber,
          startTime,
          endTime,
          subjectId: subject.id,
          teacherId: teacher.id,
          room,
        }
        const rowConflicts = detectTimetableConflicts(draftSlot, stagedSlots, teachers, subjects, classSections)

        if (rowConflicts.length > 0) {
          errors.push(`Row ${rowNumber}: ${rowConflicts[0]}`)
          return
        }

        stagedSlots.push({
          ...draftSlot,
          id: `slot-import-${section.id}-${academicDay.toLowerCase()}-${periodNumber}-${index}`,
        })
        validCount += 1
      }
    })

    return {
      validCount,
      errors,
      warnings,
    }
  }, [canManageImports, classSections, importText, importType, slots, students, subjects, teachers])

  const studentAttendancePercent = calculateStudentAttendancePercent(attendance, leaves, selectedStudentId)
  const reviewableLeaves = useMemo(
    () => leaves.filter((leave) => isAdmin || (isFaculty && leave.reviewerId === actorId)),
    [actorId, isAdmin, isFaculty, leaves],
  )
  const canSubmitLeave = canApplyLeave && selectedStudentSlots.length > 0 && leaveReason.trim().length >= 8
  const pendingLeave = reviewableLeaves.find((leave) => leave.status === 'pending')
  const roleHero = isAdmin
    ? {
        kicker: 'Main module',
        title: 'Academic timetable, attendance, and period-wise leave',
        copy:
          'Map each class hour to a subject, teacher, room, and student roster. The same mapping drives attendance, leave routing, approvals, and audit-ready records.',
      }
    : isFaculty
      ? {
          kicker: 'Faculty workspace',
          title: 'Assigned periods, attendance, and leave decisions',
          copy:
            'See only your timetable hours, mark attendance for assigned classes, and approve leave requests routed from those exact periods.',
        }
      : {
          kicker: 'Student portal',
          title: 'My timetable, attendance, and hour-wise leave',
          copy:
            'Track today’s class schedule, check attendance health, and apply leave against the exact timetable hour that will be reviewed by the assigned teacher.',
        }

  const notify = (tone: OperationNotice['tone'], title: string, message: string) => {
    setNotice({
      tone,
      title,
      message,
    })
  }

  const denyAction = (message: string) => {
    notify('warning', 'Access limited', message)
    onAuditEvent(makeAudit(userName, 'Blocked unauthorized action', message, 'warning'))
  }

  const applyImport = () => {
    if (!canManageImports) {
      denyAction('CSV setup imports are available only to the academic admin workspace.')
      return
    }

    if (importPreview.validCount === 0) {
      notify('warning', 'Nothing imported', importPreview.errors[0] ?? 'No valid rows were found.')
      return
    }

    const rows = parseCsvRows(importText)
    let applied = 0

    if (importType === 'students') {
      const additions: Student[] = []
      rows.forEach(([rollNo, name, className, email]) => {
        const section = classSections.find((item) => item.name.toLowerCase() === className?.toLowerCase())
        const exists =
          students.some((student) => student.rollNo.toLowerCase() === rollNo?.toLowerCase()) ||
          additions.some((student) => student.rollNo.toLowerCase() === rollNo?.toLowerCase())
        if (rollNo && name && email && section && !exists) {
          additions.push({
            id: `s-${slugify(rollNo)}`,
            rollNo,
            name,
            classSectionId: section.id,
            email,
          })
        }
      })
      applied = additions.length
      setStudents((currentStudents) => [...currentStudents, ...additions])
    }

    if (importType === 'teachers') {
      const additions: Teacher[] = []
      rows.forEach(([name, department, email]) => {
        const exists =
          teachers.some((teacher) => teacher.email.toLowerCase() === email?.toLowerCase()) ||
          additions.some((teacher) => teacher.email.toLowerCase() === email?.toLowerCase())
        if (name && department && email && !exists) {
          additions.push({
            id: `t-${slugify(email)}`,
            name,
            department,
            email,
          })
        }
      })
      applied = additions.length
      setTeachers((currentTeachers) => [...currentTeachers, ...additions])
    }

    if (importType === 'subjects') {
      const additions: Subject[] = []
      rows.forEach(([code, name, department]) => {
        const exists =
          subjects.some((subject) => subject.code.toLowerCase() === code?.toLowerCase()) ||
          additions.some((subject) => subject.code.toLowerCase() === code?.toLowerCase())
        if (code && name && department && !exists) {
          additions.push({
            id: `sub-${slugify(code)}`,
            code,
            name,
            department,
          })
        }
      })
      applied = additions.length
      setSubjects((currentSubjects) => [...currentSubjects, ...additions])
    }

    if (importType === 'sections') {
      const additions: ClassSection[] = []
      rows.forEach(([name, program, semester, advisor, room]) => {
        const teacher = teachers.find(
          (item) =>
            item.name.toLowerCase() === advisor?.toLowerCase() ||
            item.email.toLowerCase() === advisor?.toLowerCase(),
        )
        const exists =
          classSections.some((section) => section.name.toLowerCase() === name?.toLowerCase()) ||
          additions.some((section) => section.name.toLowerCase() === name?.toLowerCase())
        if (name && program && semester && teacher && room && !exists) {
          additions.push({
            id: `section-${slugify(name)}`,
            name,
            program,
            semester: Number(semester),
            advisorId: teacher.id,
            room,
          })
        }
      })
      applied = additions.length
      setClassSections((currentSections) => [...currentSections, ...additions])
    }

    if (importType === 'timetable') {
      const nextSlots = [...slots]
      const additions: TimetableSlot[] = []
      rows.forEach(([className, day, period, startTime, endTime, subjectValue, teacherValue, room], index) => {
        const section = classSections.find((item) => item.name.toLowerCase() === className?.toLowerCase())
        const subject = subjects.find(
          (item) =>
            item.code.toLowerCase() === subjectValue?.toLowerCase() ||
            item.name.toLowerCase() === subjectValue?.toLowerCase(),
        )
        const teacher = teachers.find(
          (item) =>
            item.name.toLowerCase() === teacherValue?.toLowerCase() ||
            item.email.toLowerCase() === teacherValue?.toLowerCase(),
        )
        const academicDay = academicDays.find((item) => item.toLowerCase() === day?.toLowerCase())
        const periodNumber = Number(period)

        if (!section || !subject || !teacher || !academicDay || !periodNumber || !startTime || !endTime || !room) {
          return
        }

        const draftSlot: TimetableDraft = {
          classSectionId: section.id,
          day: academicDay,
          periodNumber,
          startTime,
          endTime,
          subjectId: subject.id,
          teacherId: teacher.id,
          room,
        }

        if (detectTimetableConflicts(draftSlot, nextSlots, teachers, subjects, classSections).length === 0) {
          const slot: TimetableSlot = {
            ...draftSlot,
            id: `slot-import-${section.id}-${academicDay.toLowerCase()}-${periodNumber}-${Date.now().toString(36)}-${index}`,
          }
          additions.push(slot)
          nextSlots.push(slot)
        }
      })
      applied = additions.length
      setSlots((currentSlots) =>
        [...currentSlots, ...additions].sort((first, second) =>
          first.day.localeCompare(second.day) || first.periodNumber - second.periodNumber,
        ),
      )
    }

    onAuditEvent(
      makeAudit(
        'CSV import center',
        `Imported ${importLabels[importType]}`,
        `${applied} rows applied from ${importLabels[importType]} CSV.`,
        applied > 0 ? 'success' : 'warning',
      ),
    )
    notify(
      applied > 0 ? 'success' : 'warning',
      applied > 0 ? 'Import complete' : 'Import skipped',
      `${applied} ${importLabels[importType].toLowerCase()} rows were applied.`,
    )
  }

  const applyDraftPeriod = (periodNumber: number) => {
    const period = periodTimes[periodNumber - 1] ?? periodTimes[0]
    setDraft((currentDraft) => ({
      ...currentDraft,
      periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
    }))
  }

  const useClassRoom = () => {
    if (!canMapTimetable) {
      denyAction('Room autofill is available only while mapping timetable slots as admin.')
      return
    }

    const section = sectionById.get(draft.classSectionId)
    if (!section) {
      notify('warning', 'Class not found', 'Choose a valid class before copying its default room.')
      return
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      room: section.room,
    }))
    notify('success', 'Room filled', `${section.name} default room ${section.room} is ready for mapping.`)
  }

  const useFirstFreePeriod = () => {
    if (!canMapTimetable) {
      denyAction('Free-period selection is available only to the academic admin workspace.')
      return
    }

    const usedPeriods = new Set(
      slots
        .filter((slot) => slot.classSectionId === draft.classSectionId && slot.day === draft.day)
        .map((slot) => slot.periodNumber),
    )
    const periodNumber = [1, 2, 3, 4, 5].find((period) => !usedPeriods.has(period))

    if (!periodNumber) {
      notify('warning', 'No free period found', `${sectionById.get(draft.classSectionId)?.name} is full on ${draft.day}.`)
      return
    }

    applyDraftPeriod(periodNumber)
    notify('success', 'Free period selected', `Period ${periodNumber} is available on ${draft.day}.`)
  }

  const updateDraftClass = (classSectionId: string) => {
    const section = sectionById.get(classSectionId)
    setDraft((currentDraft) => ({
      ...currentDraft,
      classSectionId,
      room: section?.room ?? currentDraft.room,
    }))
  }

  const updateDraftSubject = (subjectId: string) => {
    const subject = subjectById.get(subjectId)
    const matchingTeacher = subject
      ? teachers.find((teacher) => teacher.department === subject.department) ??
        teachers.find((teacher) => teacher.department === 'Mathematics')
      : undefined

    setDraft((currentDraft) => ({
      ...currentDraft,
      subjectId,
      teacherId: matchingTeacher?.id ?? currentDraft.teacherId,
    }))
  }

  const mapSlot = () => {
    if (!canMapTimetable) {
      denyAction('Only the academic admin can create or change timetable mappings.')
      return
    }

    if (conflicts.length > 0) {
      onAuditEvent(
        makeAudit('Academic Mapper', 'Rejected timetable mapping', conflicts[0], 'warning'),
      )
      notify('warning', 'Mapping blocked', conflicts[0])
      return
    }

    const slot: TimetableSlot = {
      ...draft,
      room: draft.room.trim(),
      id: `slot-${draft.classSectionId}-${draft.day.toLowerCase()}-${draft.periodNumber}-${Date.now().toString(36)}`,
    }

    setSlots((currentSlots) =>
      [...currentSlots, slot].sort((first, second) =>
        first.day.localeCompare(second.day) || first.periodNumber - second.periodNumber,
      ),
    )
    setSelectedClassId(slot.classSectionId)
    setSelectedDay(slot.day)
    setSelectedSlotId(slot.id)
    onAuditEvent(
      makeAudit(
        'Admin timetable mapper',
        'Mapped period',
        `${sectionById.get(slot.classSectionId)?.name} ${formatSlot(slot)} mapped to ${subjectById.get(slot.subjectId)?.code}.`,
        'success',
      ),
    )
    notify(
      'success',
      'Timetable slot mapped',
      `${sectionById.get(slot.classSectionId)?.name} ${formatSlot(slot)} now points to ${subjectById.get(slot.subjectId)?.name}.`,
    )
  }

  const markAttendance = (studentId: string, status: AttendanceStatus) => {
    if (!selectedSlot) {
      return
    }

    if (!canMarkAttendance || (isFaculty && selectedSlot.teacherId !== actorId)) {
      denyAction('Attendance can be marked only by the admin or the teacher assigned to this timetable hour.')
      return
    }

    setAttendance((currentRecords) =>
      upsertAttendanceRecord(currentRecords, selectedSlot.id, studentId, selectedDate, status, actorId),
    )
    onAuditEvent(
      makeAudit(
        teacherById.get(selectedSlot.teacherId)?.name ?? 'Teacher',
        'Marked attendance',
        `${studentById.get(studentId)?.rollNo} set to ${statusLabel(status)} for ${formatSlot(selectedSlot)}.`,
        status === 'absent' ? 'warning' : 'success',
      ),
    )
    notify(
      status === 'absent' ? 'warning' : 'success',
      'Attendance updated',
      `${studentById.get(studentId)?.name} is marked ${statusLabel(status)} for ${formatSlot(selectedSlot)}.`,
    )
  }

  const markUnmarkedPresent = () => {
    if (!selectedSlot) {
      notify('warning', 'No period selected', 'Select a timetable hour before marking attendance.')
      return
    }

    if (!canMarkAttendance || (isFaculty && selectedSlot.teacherId !== actorId)) {
      denyAction('Bulk attendance can be marked only by the assigned teacher or the academic admin.')
      return
    }

    const unmarkedStudents = sectionStudents.filter((student) => {
      const leave = getLeaveForSlot(leaves, selectedSlot.id, selectedDate, student.id)
      const record = getAttendanceForSlot(attendance, selectedSlot.id, selectedDate, student.id)
      return !leave && !record
    })

    if (unmarkedStudents.length === 0) {
      notify('info', 'Nothing to mark', 'Every student already has attendance or leave for this hour.')
      return
    }

    setAttendance((currentRecords) =>
      unmarkedStudents.reduce(
        (records, student) =>
          upsertAttendanceRecord(records, selectedSlot.id, student.id, selectedDate, 'present', actorId),
        currentRecords,
      ),
    )
    onAuditEvent(
      makeAudit(
        teacherById.get(selectedSlot.teacherId)?.name ?? 'Teacher',
        'Bulk marked attendance',
        `${unmarkedStudents.length} unmarked students set to Present for ${formatSlot(selectedSlot)}.`,
        'success',
      ),
    )
    notify('success', 'Attendance completed', `${unmarkedStudents.length} unmarked students were marked Present.`)
  }

  const submitLeave = () => {
    if (!canApplyLeave) {
      denyAction('Period-wise leave applications are available from the student or admin workspace.')
      return
    }

    const slot = slots.find((item) => item.id === studentLeaveSlotId)
    if (!slot || !canSubmitLeave) {
      onAuditEvent(
        makeAudit('Leave workflow', 'Leave validation failed', 'Select a valid timetable hour and enter a reason.', 'warning'),
      )
      notify('warning', 'Leave not submitted', 'Select a valid timetable hour and enter a reason.')
      return
    }

    if (slot.classSectionId !== selectedStudent.classSectionId) {
      onAuditEvent(
        makeAudit('Leave workflow', 'Leave validation failed', 'Selected hour does not belong to the student class.', 'warning'),
      )
      notify('warning', 'Wrong class hour', 'The selected hour does not belong to this student class.')
      return
    }

    if (isStudent && selectedStudent.id !== actorId) {
      denyAction('Students can apply leave only for their own profile.')
      return
    }

    if (!selectedDate) {
      onAuditEvent(
        makeAudit('Leave workflow', 'Leave validation failed', 'Select a valid leave date.', 'warning'),
      )
      notify('warning', 'Date missing', 'Select a valid leave date.')
      return
    }

    const existingLeave = getLeaveForSlot(leaves, slot.id, selectedDate, selectedStudentId)
    if (existingLeave) {
      onAuditEvent(
        makeAudit('Leave workflow', 'Duplicate leave blocked', `${existingLeave.id} already covers this hour.`, 'warning'),
      )
      notify('warning', 'Duplicate leave blocked', `${existingLeave.id} already covers this student and hour.`)
      return
    }

    const request: LeaveRequest = {
      id: makeReadableId('LR'),
      studentId: selectedStudentId,
      slotId: slot.id,
      date: selectedDate,
      reason: leaveReason.trim(),
      status: 'pending',
      reviewerId: slot.teacherId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setLeaves((currentLeaves) => [request, ...currentLeaves])
    setAttendance((currentRecords) =>
      upsertAttendanceRecord(currentRecords, slot.id, selectedStudentId, selectedDate, 'pending_leave', slot.teacherId),
    )
    onAuditEvent(
      makeAudit(
        'Period-wise leave agent',
        'Routed leave',
        `${selectedStudent.rollNo} leave routed to ${teacherById.get(slot.teacherId)?.name} for ${formatSlot(slot)}.`,
        'info',
      ),
    )
    notify(
      'success',
      'Leave routed',
      `${selectedStudent.name} leave is waiting for ${teacherById.get(slot.teacherId)?.name}.`,
    )
  }

  const resetAcademicData = async () => {
    if (!canManageSetup) {
      denyAction('Resetting academic setup is available only to the academic admin workspace.')
      return
    }

    let nextState: AcademicState = {
      version: 2,
      classSections: seededClassSections,
      students: seededStudents,
      teachers: seededTeachers,
      subjects: seededSubjects,
      slots: seededSlots,
      attendance: seededAttendance,
      leaves: seededLeaves,
    }

    if (academicSyncStatus === 'connected') {
      try {
        nextState = await resetAcademicStateOnServer()
        setAcademicSyncMessage('Academic data reset in SQLite backend.')
      } catch {
        setAcademicSyncStatus('offline')
        setAcademicSyncMessage('Backend reset failed; browser backup reset locally.')
      }
    }

    setClassSections(nextState.classSections)
    setStudents(nextState.students)
    setTeachers(nextState.teachers)
    setSubjects(nextState.subjects)
    setSlots(nextState.slots)
    setAttendance(nextState.attendance)
    setLeaves(nextState.leaves)
    setSelectedClassId(nextState.classSections[0]?.id ?? seededClassSections[0].id)
    setSelectedDay('Monday')
    setSelectedDate(today)
    setSelectedSlotId(nextState.slots[0]?.id ?? seededSlots[0].id)
    setSelectedStudentId(nextState.students[0]?.id ?? seededStudents[0].id)
    setStudentLeaveSlotId(nextState.slots[1]?.id ?? nextState.slots[0]?.id ?? seededSlots[1].id)
    setLeaveReason('Medical appointment during the selected hour.')
    setDraft(defaultDraft)
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage cleanup failures; in-memory reset still succeeds.
    }
    onAuditEvent(makeAudit('Academic admin', 'Reset academic module', 'Demo data restored to the verified seed state.', 'info'))
    notify('info', 'Demo data reset', 'Academic module restored to the verified seed state.')
  }

  const resolveLeave = (leaveId: string, status: LeaveStatus) => {
    const leave = leaves.find((item) => item.id === leaveId)
    const slot = leave ? slots.find((item) => item.id === leave.slotId) : undefined

    if (!leave || !slot) {
      return
    }

    if (!canApproveLeave || (isFaculty && leave.reviewerId !== actorId)) {
      denyAction('Leave can be approved only by the admin or the teacher assigned to that hour.')
      return
    }

    setLeaves((currentLeaves) =>
      currentLeaves.map((item) => (item.id === leaveId ? { ...item, status } : item)),
    )
    setAttendance((currentRecords) =>
      upsertAttendanceRecord(
        currentRecords,
        leave.slotId,
        leave.studentId,
        leave.date,
        status === 'approved' ? 'excused' : 'absent',
        slot.teacherId,
      ),
    )
    onAuditEvent(
      makeAudit(
        teacherById.get(slot.teacherId)?.name ?? 'Faculty approver',
        status === 'approved' ? 'Approved period leave' : 'Rejected period leave',
        `${leave.id} updated attendance to ${status === 'approved' ? 'Excused' : 'Absent'}.`,
        status === 'approved' ? 'success' : 'warning',
      ),
    )
    notify(
      status === 'approved' ? 'success' : 'warning',
      status === 'approved' ? 'Leave approved' : 'Leave rejected',
      `${studentById.get(leave.studentId)?.name} is now ${status === 'approved' ? 'Excused' : 'Absent'} for ${formatSlot(slot)}.`,
    )
  }

  const approveNextPendingLeave = () => {
    if (!canApproveLeave) {
      denyAction('Leave approval shortcuts are available only to faculty and admin users.')
      return
    }

    if (!pendingLeave) {
      notify('info', 'No pending leave', 'The leave queue is clear.')
      return
    }

    resolveLeave(pendingLeave.id, 'approved')
  }

  const validateSetup = () => {
    if (!canManageSetup) {
      denyAction('Setup validation is available only in the academic admin workspace.')
      return
    }

    if (setupProgress === 100) {
      notify('success', 'Setup is complete', 'Classes, people, subjects, timetable, and registers are ready.')
      return
    }

    const missingSteps = setupSteps.filter((step) => !step.complete).map((step) => step.label)
    notify('warning', 'Setup needs attention', `Missing: ${missingSteps.join(', ')}.`)
  }

  const workspace = {
    currentRole,
    actorId,
    isAdmin,
    isFaculty,
    isStudent,
    canManageSetup,
    canManageImports,
    canMapTimetable,
    canMarkAttendance,
    canApproveLeave,
    canApplyLeave,
    classSections,
    students,
    teachers,
    subjects,
    slots,
    attendance,
    leaves,
    teacherById,
    subjectById,
    sectionById,
    studentById,
    currentTeacher,
    availableDailyRoles,
    availableClassSections,
    sectionStudents,
    visibleSectionStudents,
    daySlots,
    visibleSlots,
    selectedSlot,
    selectedStudent,
    selectedStudentSlots,
    selectedSlotSummary,
    mappedStats,
    setupSteps,
    setupProgress,
    focusedTeacher,
    teacherDaySlots,
    studentDaySlots,
    importLabels,
    importSamples,
    importType,
    importText,
    importPreview,
    studentAttendancePercent,
    reviewableLeaves,
    canSubmitLeave,
    notice,
    academicSyncStatus,
    academicSyncMessage,
    roleHero,
    conflicts,
    draft,
    activeDailyRole,
    selectedClassId,
    selectedDay,
    selectedDate,
    selectedSlotId,
    selectedStudentId,
    studentLeaveSlotId,
    studentSearch,
    leaveReason,
    setActiveDailyRole,
    setImportType,
    setImportText,
    setDraft,
    setSelectedClassId,
    setSelectedDay,
    setSelectedDate,
    setSelectedSlotId,
    setSelectedStudentId,
    setStudentLeaveSlotId,
    setStudentSearch,
    setLeaveReason,
    notify,
    applyImport,
    applyDraftPeriod,
    useClassRoom,
    useFirstFreePeriod,
    updateDraftClass,
    updateDraftSubject,
    mapSlot,
    markAttendance,
    markUnmarkedPresent,
    submitLeave,
    resetAcademicData,
    resolveLeave,
    approveNextPendingLeave,
    validateSetup,
    formatSlot,
  }

  return (
    <AcademicWorkspaceContext.Provider value={workspace}>
      <section className={`academic-command academic-command--${currentRole}`} aria-label="Academic operations">
        <Suspense
          fallback={
            <div className="academic-role-loading">
              <strong>Preparing workspace</strong>
              <span>Loading the tools for this login.</span>
            </div>
          }
        >
          {isAdmin ? <AdminAcademicWorkspace /> : isFaculty ? <FacultyAcademicWorkspace /> : <StudentAcademicWorkspace />}
        </Suspense>
      </section>
    </AcademicWorkspaceContext.Provider>
  )
}
