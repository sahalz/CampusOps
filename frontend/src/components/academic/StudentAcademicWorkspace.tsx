import clsx from 'clsx'
import {
  AcademicOverview,
  ClassTimetable,
  DailyWorkbench,
  QuickActions,
  StudentLeavePanel,
} from './AcademicCommonPanels'
import { useAcademicWorkspace } from './AcademicWorkspaceContext'

export function StudentAcademicWorkspace() {
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
      </div>

      <div className={clsx('academic-lower-grid', `academic-lower-grid--${currentRole}`)}>
        <StudentLeavePanel />
      </div>
    </>
  )
}
