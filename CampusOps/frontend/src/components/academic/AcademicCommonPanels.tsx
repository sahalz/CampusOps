import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCheck,
  CircleCheck,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  ListChecks,
  RotateCcw,
  School,
  TableProperties,
  UserRoundCheck,
  Users,
  WandSparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { academicDays } from '../../data/academic'
import { summarizeAttendance } from '../../lib/academic'
import type { AcademicDay } from '../../types'
import { useAcademicWorkspace } from './AcademicWorkspaceContext'

export function AcademicOverview() {
  const {
    canManageSetup,
    academicSyncMessage,
    academicSyncStatus,
    isAdmin,
    isFaculty,
    isStudent,
    leaves,
    mappedStats,
    notice,
    resetAcademicData,
    reviewableLeaves,
    roleHero,
    sectionById,
    selectedStudent,
    slots,
    studentAttendancePercent,
    studentDaySlots,
    students,
    visibleSlots,
  } = useAcademicWorkspace()
  const NoticeIcon = notice.tone === 'warning' ? AlertTriangle : notice.tone === 'success' ? CircleCheck : WandSparkles
  const academicKpis = isStudent
    ? [
        {
          label: 'My class',
          value: sectionById.get(selectedStudent.classSectionId)?.name ?? 'Class',
          icon: GraduationCap,
        },
        {
          label: 'My attendance',
          value: `${studentAttendancePercent}%`,
          icon: ClipboardList,
        },
        {
          label: 'Today periods',
          value: studentDaySlots.length,
          icon: CalendarDays,
        },
        {
          label: 'My pending leave',
          value: leaves.filter((leave) => leave.studentId === selectedStudent.id && leave.status === 'pending').length,
          icon: UserRoundCheck,
        },
      ]
    : isFaculty
      ? [
          {
            label: 'My sections',
            value: new Set(visibleSlots.map((slot) => slot.classSectionId)).size,
            icon: School,
          },
          {
            label: 'My students',
            value: new Set(
              students
                .filter((student) => visibleSlots.some((slot) => slot.classSectionId === student.classSectionId))
                .map((student) => student.id),
            ).size,
            icon: Users,
          },
          {
            label: 'My periods',
            value: visibleSlots.length,
            icon: CalendarDays,
          },
          {
            label: 'My leave queue',
            value: reviewableLeaves.filter((leave) => leave.status === 'pending').length,
            icon: UserRoundCheck,
          },
        ]
      : [
          {
            label: 'Sections',
            value: mappedStats.sections,
            icon: School,
          },
          {
            label: 'Students',
            value: mappedStats.totalStudents,
            icon: Users,
          },
          {
            label: 'Marked today',
            value: mappedStats.todayMarked,
            icon: ClipboardList,
          },
          {
            label: 'Leave queue',
            value: mappedStats.pendingLeaves,
            icon: UserRoundCheck,
          },
        ]

  return (
    <>
      <div className="academic-hero">
        <div>
          <span className="eyebrow">{roleHero.kicker}</span>
          <h2>{roleHero.title}</h2>
          <p>{roleHero.copy}</p>
          <div className={clsx('master-sync-chip', `is-${academicSyncStatus}`)}>
            <span>
              {academicSyncStatus === 'connected'
                ? 'SQLite backend'
                : academicSyncStatus === 'checking'
                  ? 'Checking backend'
                  : 'Browser backup'}
            </span>
            <strong>{academicSyncMessage}</strong>
          </div>
        </div>
        <div className="academic-hero__side">
          <div className="academic-health">
            <strong>{isAdmin ? slots.length : visibleSlots.length}</strong>
            <span>{isAdmin ? 'mapped timetable slots' : 'visible timetable slots'}</span>
          </div>
          {canManageSetup ? (
            <button type="button" className="secondary-action" onClick={resetAcademicData}>
              <RotateCcw size={15} />
              <span>Reset demo data</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="academic-kpis">
        {academicKpis.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          )
        })}
      </div>

      <div className={clsx('operation-notice', `notice-${notice.tone}`)}>
        <NoticeIcon size={18} />
        <div>
          <strong>{notice.title}</strong>
          <span>{notice.message}</span>
        </div>
      </div>
    </>
  )
}

export function QuickActions() {
  const {
    canApproveLeave,
    canMapTimetable,
    canMarkAttendance,
    isStudent,
    markUnmarkedPresent,
    approveNextPendingLeave,
    notify,
    setActiveDailyRole,
    useClassRoom,
    useFirstFreePeriod,
  } = useAcademicWorkspace()

  return (
    <div className="quick-action-strip" aria-label="Quick academic actions">
      {canMapTimetable ? (
        <>
          <button type="button" onClick={useFirstFreePeriod}>
            <WandSparkles size={16} />
            <span>Pick free period</span>
          </button>
          <button type="button" onClick={useClassRoom}>
            <DoorOpen size={16} />
            <span>Use class room</span>
          </button>
        </>
      ) : null}
      {canMarkAttendance ? (
        <button type="button" onClick={markUnmarkedPresent}>
          <CheckCheck size={16} />
          <span>Mark unmarked present</span>
        </button>
      ) : null}
      {canApproveLeave ? (
        <button type="button" onClick={approveNextPendingLeave}>
          <ListChecks size={16} />
          <span>Approve next leave</span>
        </button>
      ) : null}
      {isStudent ? (
        <button
          type="button"
          onClick={() => {
            setActiveDailyRole('student')
            notify('info', 'Leave desk ready', 'Choose the affected timetable hour and send your reason below.')
          }}
        >
          <BookOpen size={16} />
          <span>Prepare leave request</span>
        </button>
      ) : null}
    </div>
  )
}

export function DailyWorkbench() {
  const {
    activeDailyRole,
    availableDailyRoles,
    focusedTeacher,
    formatSlot,
    mappedStats,
    sectionById,
    selectedDay,
    selectedStudent,
    setActiveDailyRole,
    setupProgress,
    setupSteps,
    studentAttendancePercent,
    studentDaySlots,
    subjectById,
    teacherById,
    teacherDaySlots,
  } = useAcademicWorkspace()

  return (
    <section className="panel daily-workbench">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Role views</span>
          <h2>Today’s work</h2>
        </div>
        <TableProperties size={20} />
      </div>
      <div className="mini-tabs" aria-label="Daily role view">
        {availableDailyRoles.map((role) => (
          <button
            key={role}
            type="button"
            className={clsx(activeDailyRole === role && 'is-active')}
            onClick={() => setActiveDailyRole(role)}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>
      {activeDailyRole === 'admin' ? (
        <div className="daily-card-list">
          <article>
            <strong>{setupProgress}% setup complete</strong>
            <span>{setupSteps.filter((step) => !step.complete).length} setup gaps remaining</span>
          </article>
          <article>
            <strong>{mappedStats.pendingLeaves} leave requests</strong>
            <span>Need faculty decision or audit follow-up</span>
          </article>
          <article>
            <strong>{mappedStats.busiestTeacher.teacher.name}</strong>
            <span>{mappedStats.busiestTeacher.count} weekly slots assigned</span>
          </article>
        </div>
      ) : null}
      {activeDailyRole === 'teacher' ? (
        <div className="daily-card-list">
          <article>
            <strong>{focusedTeacher?.name ?? 'Teacher'}</strong>
            <span>{teacherDaySlots.length} periods on {selectedDay}</span>
          </article>
          {teacherDaySlots.slice(0, 3).map((slot) => (
            <article key={slot.id}>
              <strong>{formatSlot(slot)} / {subjectById.get(slot.subjectId)?.name}</strong>
              <span>{sectionById.get(slot.classSectionId)?.name} / {slot.room}</span>
            </article>
          ))}
          {teacherDaySlots.length === 0 ? (
            <article>
              <strong>No periods today</strong>
              <span>Select another day or teacher slot.</span>
            </article>
          ) : null}
        </div>
      ) : null}
      {activeDailyRole === 'student' ? (
        <div className="daily-card-list">
          <article>
            <strong>{selectedStudent.name}</strong>
            <span>{studentAttendancePercent}% attendance / {studentDaySlots.length} periods on {selectedDay}</span>
          </article>
          {studentDaySlots.slice(0, 3).map((slot) => (
            <article key={slot.id}>
              <strong>{formatSlot(slot)} / {subjectById.get(slot.subjectId)?.name}</strong>
              <span>{teacherById.get(slot.teacherId)?.name} / {slot.room}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function ClassTimetable() {
  const {
    attendance,
    availableClassSections,
    daySlots,
    formatSlot,
    isStudent,
    leaves,
    sectionStudents,
    selectedClassId,
    selectedDate,
    selectedDay,
    selectedSlot,
    setSelectedClassId,
    setSelectedDate,
    setSelectedDay,
    setSelectedSlotId,
    setStudentLeaveSlotId,
    subjectById,
    teacherById,
  } = useAcademicWorkspace()

  return (
    <section className="panel academic-panel--timetable">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Structured mapping</span>
          <h2>Class timetable</h2>
        </div>
        <CalendarDays size={20} />
      </div>
      <div className="academic-filters">
        <select
          value={selectedClassId}
          disabled={isStudent}
          onChange={(event) => setSelectedClassId(event.target.value)}
        >
          {availableClassSections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name} / {section.program}
            </option>
          ))}
        </select>
        <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value as AcademicDay)}>
          {academicDays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
      </div>
      <div className="timetable-list">
        {daySlots.length > 0 ? (
          daySlots.map((slot) => {
            const summary = summarizeAttendance(attendance, leaves, slot.id, selectedDate, sectionStudents)
            return (
              <button
                key={slot.id}
                type="button"
                className={clsx('timetable-slot', selectedSlot?.id === slot.id && 'is-active')}
                onClick={() => {
                  setSelectedSlotId(slot.id)
                  setStudentLeaveSlotId(slot.id)
                }}
              >
                <span>{formatSlot(slot)}</span>
                <strong>{subjectById.get(slot.subjectId)?.name}</strong>
                <small>
                  {teacherById.get(slot.teacherId)?.name} / {slot.room}
                </small>
                <div>
                  <em>{sectionStudents.length} students</em>
                  <em>{summary.present} present</em>
                  <em>{summary.pendingLeave} leave</em>
                </div>
              </button>
            )
          })
        ) : (
          <div className="empty-state empty-state--boxed">
            <CalendarDays size={18} />
            <span>No timetable slots mapped for this class and day.</span>
          </div>
        )}
      </div>
    </section>
  )
}

export function StudentLeavePanel() {
  const {
    canSubmitLeave,
    formatSlot,
    isStudent,
    leaveReason,
    sectionById,
    selectedStudent,
    selectedStudentId,
    selectedStudentSlots,
    setLeaveReason,
    setSelectedStudentId,
    setStudentLeaveSlotId,
    studentAttendancePercent,
    studentLeaveSlotId,
    students,
    submitLeave,
    subjectById,
    teacherById,
  } = useAcademicWorkspace()

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Student portal</span>
          <h2>Period-wise leave</h2>
        </div>
        <GraduationCap size={20} />
      </div>
      <div className="student-leave-form">
        <label>
          {isStudent ? 'Your profile' : 'Student'}
          {isStudent ? (
            <div className="locked-field">
              <strong>{selectedStudent.name}</strong>
              <span>{selectedStudent.rollNo} / {sectionById.get(selectedStudent.classSectionId)?.name}</span>
            </div>
          ) : (
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.rollNo} / {student.name}
                </option>
              ))}
            </select>
          )}
        </label>
        <label>
          Affected hour
          <select value={studentLeaveSlotId} onChange={(event) => setStudentLeaveSlotId(event.target.value)}>
            {selectedStudentSlots.length > 0 ? (
              selectedStudentSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatSlot(slot)} / {subjectById.get(slot.subjectId)?.name} / {teacherById.get(slot.teacherId)?.name}
                </option>
              ))
            ) : (
              <option value="">No mapped slots for selected day</option>
            )}
          </select>
        </label>
        <label>
          Reason
          <textarea value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} />
        </label>
        <button
          type="button"
          className="primary-action primary-action--wide"
          disabled={!canSubmitLeave}
          onClick={submitLeave}
        >
          <BookOpen size={16} />
          <span>Apply leave for selected hour</span>
        </button>
      </div>
      <div className="student-health">
        <strong>{studentAttendancePercent}%</strong>
        <span>attendance for {selectedStudent.rollNo}</span>
      </div>
    </section>
  )
}
