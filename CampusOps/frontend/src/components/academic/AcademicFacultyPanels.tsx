import {
  Check,
  CheckCheck,
  ClipboardList,
  Search,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { getAttendanceForSlot, getLeaveForSlot, statusLabel } from '../../lib/academic'
import type { AttendanceStatus } from '../../types'
import { useAcademicWorkspace } from './AcademicWorkspaceContext'

export function AttendanceRecorder() {
  const {
    actorId,
    attendance,
    canMarkAttendance,
    formatSlot,
    isFaculty,
    leaves,
    markAttendance,
    markUnmarkedPresent,
    sectionById,
    selectedDate,
    selectedSlot,
    selectedSlotSummary,
    setStudentSearch,
    studentSearch,
    subjectById,
    teacherById,
    visibleSectionStudents,
  } = useAcademicWorkspace()

  return (
    <section className="panel academic-panel--attendance">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Teacher register</span>
          <h2>Attendance recorder</h2>
        </div>
        <ClipboardList size={20} />
      </div>
      {selectedSlot ? (
        <>
          <div className="slot-context">
            <strong>{subjectById.get(selectedSlot.subjectId)?.name}</strong>
            <span>
              {sectionById.get(selectedSlot.classSectionId)?.name} / {formatSlot(selectedSlot)} /{' '}
              {teacherById.get(selectedSlot.teacherId)?.name}
            </span>
          </div>
          <div className="attendance-summary">
            <span>{selectedSlotSummary.present} present</span>
            <span>{selectedSlotSummary.absent} absent</span>
            <span>{selectedSlotSummary.excused} excused</span>
            <span>{selectedSlotSummary.pendingLeave} pending leave</span>
          </div>
          <div className="attendance-toolbar">
            <label>
              <Search size={15} />
              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Find student"
                aria-label="Find student"
              />
            </label>
            <button type="button" className="secondary-action" onClick={markUnmarkedPresent}>
              <CheckCheck size={15} />
              <span>Mark unmarked present</span>
            </button>
          </div>
          <div className="attendance-list">
            {visibleSectionStudents.map((student) => {
              const leave = getLeaveForSlot(leaves, selectedSlot.id, selectedDate, student.id)
              const record = getAttendanceForSlot(attendance, selectedSlot.id, selectedDate, student.id)
              const status =
                leave?.status === 'approved'
                  ? 'excused'
                  : leave?.status === 'pending'
                    ? 'pending_leave'
                    : record?.status

              return (
                <article key={student.id} className="attendance-row">
                  <div>
                    <strong>{student.name}</strong>
                    <span>{student.rollNo}</span>
                    <span className={clsx('attendance-status-pill', status ?? 'unmarked')}>
                      {status ? statusLabel(status) : 'Unmarked'}
                    </span>
                  </div>
                  <div className="attendance-actions">
                    {(['present', 'absent', 'excused'] satisfies AttendanceStatus[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={clsx(status === item && 'is-active')}
                        disabled={!canMarkAttendance || (isFaculty && selectedSlot.teacherId !== actorId)}
                        onClick={() => markAttendance(student.id, item)}
                      >
                        {item.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
            {visibleSectionStudents.length === 0 ? (
              <div className="empty-state empty-state--boxed">
                <Search size={18} />
                <span>No student matches this search.</span>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-state empty-state--boxed">
          <ClipboardList size={18} />
          <span>Select a timetable slot to mark attendance.</span>
        </div>
      )}
    </section>
  )
}

export function LeaveQueue() {
  const { formatSlot, resolveLeave, reviewableLeaves, slots, studentById, subjectById } = useAcademicWorkspace()

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Faculty approval</span>
          <h2>Leave queue</h2>
        </div>
        <UserRoundCheck size={20} />
      </div>
      <div className="leave-list">
        {reviewableLeaves.length > 0 ? (
          reviewableLeaves.map((leave) => {
            const slot = slots.find((item) => item.id === leave.slotId)
            const student = studentById.get(leave.studentId)
            return (
              <article key={leave.id} className={clsx('leave-row', `is-${leave.status}`)}>
                <div>
                  <span>
                    {leave.id} / {student?.rollNo} / {leave.date}
                  </span>
                  <strong>{student?.name}</strong>
                  <small>
                    {slot ? `${formatSlot(slot)} / ${subjectById.get(slot.subjectId)?.name}` : 'Slot missing'}
                  </small>
                  <p>{leave.reason}</p>
                </div>
                {leave.status === 'pending' ? (
                  <div className="approval-actions">
                    <button
                      type="button"
                      className="icon-button icon-button--approve"
                      aria-label={`Approve ${leave.id}`}
                      onClick={() => resolveLeave(leave.id, 'approved')}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--block"
                      aria-label={`Reject ${leave.id}`}
                      onClick={() => resolveLeave(leave.id, 'rejected')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="status-chip">{leave.status}</span>
                )}
              </article>
            )
          })
        ) : (
          <div className="empty-state empty-state--boxed">
            <UserRoundCheck size={18} />
            <span>No leave requests are assigned to this workspace.</span>
          </div>
        )}
      </div>
    </section>
  )
}

export function TeacherAssignments() {
  const { currentTeacher, isFaculty, mappedStats, slots, teachers } = useAcademicWorkspace()
  const visibleTeachers = isFaculty && currentTeacher ? [currentTeacher] : teachers

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Load balance</span>
          <h2>Teacher assignments</h2>
        </div>
        <Users size={20} />
      </div>
      <div className="teacher-load-list">
        {visibleTeachers.map((teacher) => {
          const teacherSlots = slots.filter((slot) => slot.teacherId === teacher.id)
          return (
            <article key={teacher.id} className="teacher-load-row">
              <div>
                <strong>{teacher.name}</strong>
                <span>{teacher.department}</span>
              </div>
              <strong>{teacherSlots.length}</strong>
              <small>weekly slots</small>
            </article>
          )
        })}
      </div>
      <div className="mapping-preview mapping-preview--quiet">
        <Check size={18} />
        <span>
          {isFaculty && currentTeacher
            ? `${currentTeacher.name} has ${slots.filter((slot) => slot.teacherId === currentTeacher.id).length} mapped slots.`
            : `Busiest: ${mappedStats.busiestTeacher.teacher.name} with ${mappedStats.busiestTeacher.count} mapped slots.`}
        </span>
      </div>
    </section>
  )
}
