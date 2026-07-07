import clsx from 'clsx'
import {
  AcademicOverview,
  ClassTimetable,
  DailyWorkbench,
  QuickActions,
} from './AcademicCommonPanels'
import {
  AttendanceRecorder,
  LeaveQueue,
  TeacherAssignments,
} from './AcademicFacultyPanels'
import { useAcademicWorkspace } from './AcademicWorkspaceContext'

export function FacultyAcademicWorkspace() {
  const { currentRole } = useAcademicWorkspace()

  return (
    <>
      <AcademicOverview />
      <QuickActions />

      <div className={clsx('client-workbench-grid', `client-workbench-grid--${currentRole}`)}>
        <DailyWorkbench />
      </div>

      <div className={clsx('academic-grid', `academic-grid--${currentRole}`)}>
        <ClassTimetable />
        <AttendanceRecorder />
      </div>

      <div className={clsx('academic-lower-grid', `academic-lower-grid--${currentRole}`)}>
        <LeaveQueue />
        <TeacherAssignments />
      </div>
    </>
  )
}
