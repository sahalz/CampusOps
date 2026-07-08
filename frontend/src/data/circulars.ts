import type { Circular } from '../types'

export const circulars: Circular[] = [
  {
    id: 'CIR-2026-071',
    title: 'Semester 5 timetable lock for CSE sections',
    body: 'The CSE semester 5 timetable is locked for this week. Attendance and leave requests should be raised against the mapped hour only.',
    priority: 'important',
    audience: {
      type: 'department',
      department: 'Computer Science',
    },
    publishedAt: '2026-07-07',
    expiresAt: '2026-07-14',
    attachmentName: 'semester-5-timetable.pdf',
    createdBy: 'Dr. Priya Menon',
  },
  {
    id: 'CIR-2026-072',
    title: 'AI Lab unavailable during period 5',
    body: 'AI Lab maintenance is scheduled today during period 5. Faculty should shift mapped practical sessions to the assigned backup room.',
    priority: 'urgent',
    audience: {
      type: 'faculty',
    },
    publishedAt: '2026-07-07',
    expiresAt: '2026-07-08',
    createdBy: 'Admin Office',
  },
  {
    id: 'CIR-2026-073',
    title: 'CSE-A placement orientation',
    body: 'CSE-A students must attend the placement orientation after regular classes. Attendance will be recorded separately by the placement cell.',
    priority: 'normal',
    audience: {
      type: 'class',
      classSectionId: 'cse-5a',
    },
    publishedAt: '2026-07-06',
    expiresAt: '2026-07-12',
    attachmentName: 'orientation-agenda.pdf',
    createdBy: 'Placement Cell',
  },
  {
    id: 'CIR-2026-074',
    title: 'Library digital access renewal',
    body: 'All students and faculty can renew digital library access from the portal before the end of this week.',
    priority: 'normal',
    audience: {
      type: 'everyone',
    },
    publishedAt: '2026-07-05',
    expiresAt: '2026-07-11',
    createdBy: 'Library Office',
  },
]
