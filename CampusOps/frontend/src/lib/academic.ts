import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassSection,
  LeaveRequest,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
} from '../types'

export type TimetableDraft = Omit<TimetableSlot, 'id'>

export function getSectionStudents(students: Student[], classSectionId: string) {
  return students.filter((student) => student.classSectionId === classSectionId)
}

export function getAttendanceForSlot(
  records: AttendanceRecord[],
  slotId: string,
  date: string,
  studentId: string,
): AttendanceRecord | undefined {
  return records.find((record) => record.slotId === slotId && record.date === date && record.studentId === studentId)
}

export function getLeaveForSlot(
  requests: LeaveRequest[],
  slotId: string,
  date: string,
  studentId: string,
): LeaveRequest | undefined {
  return requests.find((request) => request.slotId === slotId && request.date === date && request.studentId === studentId)
}

export function summarizeAttendance(
  records: AttendanceRecord[],
  requests: LeaveRequest[],
  slotId: string,
  date: string,
  roster: Student[],
) {
  return roster.reduce(
    (summary, student) => {
      const leave = getLeaveForSlot(requests, slotId, date, student.id)
      const record = getAttendanceForSlot(records, slotId, date, student.id)
      const status = leave?.status === 'approved' ? 'excused' : leave?.status === 'pending' ? 'pending_leave' : record?.status

      if (status === 'present') {
        summary.present += 1
      } else if (status === 'absent') {
        summary.absent += 1
      } else if (status === 'excused') {
        summary.excused += 1
      } else if (status === 'pending_leave') {
        summary.pendingLeave += 1
      } else {
        summary.unmarked += 1
      }

      return summary
    },
    {
      present: 0,
      absent: 0,
      excused: 0,
      pendingLeave: 0,
      unmarked: 0,
    },
  )
}

export function calculateStudentAttendancePercent(
  records: AttendanceRecord[],
  requests: LeaveRequest[],
  studentId: string,
) {
  const studentRecords = records.filter((record) => record.studentId === studentId)
  const approvedLeaves = requests.filter((request) => request.studentId === studentId && request.status === 'approved')
  const recordKeys = new Set(studentRecords.map((record) => `${record.slotId}:${record.date}`))
  const approvedLeaveKeys = new Set(approvedLeaves.map((leave) => `${leave.slotId}:${leave.date}`))
  const attended = studentRecords.filter(
    (record) =>
      record.status === 'present' ||
      record.status === 'excused' ||
      approvedLeaveKeys.has(`${record.slotId}:${record.date}`),
  ).length
  const approvedLeavesWithoutRecords = approvedLeaves.filter(
    (leave) => !recordKeys.has(`${leave.slotId}:${leave.date}`),
  ).length
  const total = studentRecords.length + approvedLeavesWithoutRecords

  if (total === 0) {
    return 100
  }

  return Math.round(((attended + approvedLeavesWithoutRecords) / total) * 100)
}

export function detectTimetableConflicts(
  draft: TimetableDraft,
  slots: TimetableSlot[],
  teachers: Teacher[],
  subjects: Subject[],
  sections: ClassSection[],
) {
  const conflicts: string[] = []
  const subject = subjects.find((item) => item.id === draft.subjectId)
  const teacher = teachers.find((item) => item.id === draft.teacherId)
  const section = sections.find((item) => item.id === draft.classSectionId)
  const room = draft.room.trim()

  if (!section) {
    conflicts.push('Select a valid class section.')
  }

  if (!subject) {
    conflicts.push('Select a valid subject.')
  }

  if (!teacher) {
    conflicts.push('Select a valid teacher.')
  }

  if (!room) {
    conflicts.push('Room is required.')
  }

  if (!draft.startTime || !draft.endTime) {
    conflicts.push('Start and end time are required.')
  }

  if (draft.startTime && draft.endTime && draft.startTime >= draft.endTime) {
    conflicts.push('End time must be after start time.')
  }

  if (!Number.isInteger(draft.periodNumber) || draft.periodNumber < 1 || draft.periodNumber > 8) {
    conflicts.push('Period number must be between 1 and 8.')
  }

  const sameClassPeriod = slots.find(
    (slot) =>
      slot.classSectionId === draft.classSectionId &&
      slot.day === draft.day &&
      slot.periodNumber === draft.periodNumber,
  )

  if (sameClassPeriod) {
    conflicts.push(`${section?.name ?? 'This class'} already has a period ${draft.periodNumber} slot on ${draft.day}.`)
  }

  const teacherClash = slots.find(
    (slot) =>
      teacher &&
      draft.startTime &&
      draft.endTime &&
      slot.teacherId === draft.teacherId &&
      slot.day === draft.day &&
      (slot.periodNumber === draft.periodNumber ||
        (draft.startTime < slot.endTime && draft.endTime > slot.startTime)),
  )

  if (teacherClash) {
    conflicts.push(`${teacher?.name ?? 'Selected teacher'} is already assigned at this time.`)
  }

  const roomClash = slots.find(
    (slot) =>
      room &&
      draft.startTime &&
      draft.endTime &&
      slot.room.toLowerCase() === room.toLowerCase() &&
      slot.day === draft.day &&
      (slot.periodNumber === draft.periodNumber ||
        (draft.startTime < slot.endTime && draft.endTime > slot.startTime)),
  )

  if (roomClash) {
    conflicts.push(`${room} is already occupied at this time.`)
  }

  if (subject && teacher && subject.department !== teacher.department && teacher.department !== 'Mathematics') {
    conflicts.push(`${teacher.name} is outside the ${subject.department} department for ${subject.code}.`)
  }

  return conflicts
}

export function upsertAttendanceRecord(
  records: AttendanceRecord[],
  slotId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus,
  teacherId: string,
) {
  const updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const existing = getAttendanceForSlot(records, slotId, date, studentId)

  if (existing) {
    return records.map((record) =>
      record.id === existing.id
        ? {
            ...record,
            status,
            markedBy: teacherId,
            updatedAt,
          }
        : record,
    )
  }

  return [
    ...records,
    {
      id: `att-${Date.now()}-${studentId}`,
      slotId,
      studentId,
      date,
      status,
      markedBy: teacherId,
      updatedAt,
    },
  ]
}

export function statusLabel(status: AttendanceStatus) {
  if (status === 'pending_leave') {
    return 'Leave pending'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}
