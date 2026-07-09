import clsx from 'clsx'
import {
  SetupWizard,
  TimetableMapper,
} from './AcademicAdminPanels'
import {
  AcademicOverview,
  ClassTimetable,
  DailyWorkbench,
  QuickActions,
  StudentLeavePanel,
} from './AcademicCommonPanels'
import {
  AttendanceRecorder,
  LeaveQueue,
  TeacherAssignments,
} from './AcademicFacultyPanels'
import { useAcademicWorkspace } from './AcademicWorkspaceContext'

export function AdminAcademicWorkspace() {
  const { currentRole } = useAcademicWorkspace()

  return (
    <>
      <AcademicOverview />
      <QuickActions />

      <div className={clsx('client-workbench-grid', `client-workbench-grid--${currentRole}`)}>
        <SetupWizard />
        <DailyWorkbench />
      </div>

      <div className={clsx('academic-grid', `academic-grid--${currentRole}`)}>
        <TimetableMapper />
        <ClassTimetable />
        <AttendanceRecorder />
      </div>

      <div className={clsx('academic-lower-grid', `academic-lower-grid--${currentRole}`)}>
        <StudentLeavePanel />
        <LeaveQueue />
        <TeacherAssignments />
      </div>
    </>
  )
}
