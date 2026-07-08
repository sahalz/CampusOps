import type {
  AcademicDay,
  AttendanceRecord,
  ClassSection,
  LeaveRequest,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
} from '../types'

export const academicDays: AcademicDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const classSections: ClassSection[] = [
  {
    id: 'cse-5a',
    name: 'CSE-A',
    program: 'B.Tech CSE',
    semester: 5,
    advisorId: 't-anjali',
    room: 'B-204',
  },
  {
    id: 'cse-5b',
    name: 'CSE-B',
    program: 'B.Tech CSE',
    semester: 5,
    advisorId: 't-vikram',
    room: 'B-205',
  },
  {
    id: 'ece-3a',
    name: 'ECE-A',
    program: 'B.Tech ECE',
    semester: 3,
    advisorId: 't-fatima',
    room: 'E-102',
  },
]

export const teachers: Teacher[] = [
  {
    id: 't-anjali',
    name: 'Prof. Anjali Rao',
    department: 'Computer Science',
    email: 'anjali.rao@campus.edu',
  },
  {
    id: 't-vikram',
    name: 'Prof. Vikram Menon',
    department: 'Computer Science',
    email: 'vikram.menon@campus.edu',
  },
  {
    id: 't-fatima',
    name: 'Prof. Fatima Sheikh',
    department: 'Electronics',
    email: 'fatima.sheikh@campus.edu',
  },
  {
    id: 't-neha',
    name: 'Prof. Neha Iyer',
    department: 'Mathematics',
    email: 'neha.iyer@campus.edu',
  },
]

export const subjects: Subject[] = [
  {
    id: 'sub-dsa',
    code: 'CS501',
    name: 'Data Structures',
    department: 'Computer Science',
  },
  {
    id: 'sub-dbms',
    code: 'CS502',
    name: 'Database Systems',
    department: 'Computer Science',
  },
  {
    id: 'sub-ai',
    code: 'CS503',
    name: 'Artificial Intelligence',
    department: 'Computer Science',
  },
  {
    id: 'sub-dm',
    code: 'MA505',
    name: 'Discrete Mathematics',
    department: 'Mathematics',
  },
  {
    id: 'sub-circuits',
    code: 'EC301',
    name: 'Analog Circuits',
    department: 'Electronics',
  },
]

export const students: Student[] = [
  {
    id: 's-aisha',
    rollNo: 'CSE5A01',
    name: 'Aisha Khan',
    classSectionId: 'cse-5a',
    email: 'aisha.khan@campus.edu',
  },
  {
    id: 's-rahul',
    rollNo: 'CSE5A02',
    name: 'Rahul Nair',
    classSectionId: 'cse-5a',
    email: 'rahul.nair@campus.edu',
  },
  {
    id: 's-meera',
    rollNo: 'CSE5A03',
    name: 'Meera Shah',
    classSectionId: 'cse-5a',
    email: 'meera.shah@campus.edu',
  },
  {
    id: 's-arjun',
    rollNo: 'CSE5A04',
    name: 'Arjun Pillai',
    classSectionId: 'cse-5a',
    email: 'arjun.pillai@campus.edu',
  },
  {
    id: 's-nikhil',
    rollNo: 'CSE5B01',
    name: 'Nikhil Thomas',
    classSectionId: 'cse-5b',
    email: 'nikhil.thomas@campus.edu',
  },
  {
    id: 's-kavya',
    rollNo: 'CSE5B02',
    name: 'Kavya Reddy',
    classSectionId: 'cse-5b',
    email: 'kavya.reddy@campus.edu',
  },
  {
    id: 's-zoya',
    rollNo: 'ECE3A01',
    name: 'Zoya Fernandes',
    classSectionId: 'ece-3a',
    email: 'zoya.fernandes@campus.edu',
  },
  {
    id: 's-dev',
    rollNo: 'ECE3A02',
    name: 'Dev Sharma',
    classSectionId: 'ece-3a',
    email: 'dev.sharma@campus.edu',
  },
]

export const timetableSlots: TimetableSlot[] = [
  {
    id: 'slot-cse5a-mon-1',
    classSectionId: 'cse-5a',
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-dsa',
    teacherId: 't-anjali',
    room: 'B-204',
  },
  {
    id: 'slot-cse5a-mon-2',
    classSectionId: 'cse-5a',
    day: 'Monday',
    periodNumber: 2,
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'sub-dbms',
    teacherId: 't-vikram',
    room: 'Lab-2',
  },
  {
    id: 'slot-cse5a-mon-3',
    classSectionId: 'cse-5a',
    day: 'Monday',
    periodNumber: 3,
    startTime: '11:15',
    endTime: '12:15',
    subjectId: 'sub-ai',
    teacherId: 't-anjali',
    room: 'AI Lab',
  },
  {
    id: 'slot-cse5a-tue-1',
    classSectionId: 'cse-5a',
    day: 'Tuesday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-dm',
    teacherId: 't-neha',
    room: 'B-204',
  },
  {
    id: 'slot-cse5b-mon-1',
    classSectionId: 'cse-5b',
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-dbms',
    teacherId: 't-vikram',
    room: 'B-205',
  },
  {
    id: 'slot-ece3a-mon-1',
    classSectionId: 'ece-3a',
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-circuits',
    teacherId: 't-fatima',
    room: 'E-102',
  },
]

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    slotId: 'slot-cse5a-mon-1',
    studentId: 's-aisha',
    date: '2026-07-06',
    status: 'present',
    markedBy: 't-anjali',
    updatedAt: '09:08',
  },
  {
    id: 'att-2',
    slotId: 'slot-cse5a-mon-1',
    studentId: 's-rahul',
    date: '2026-07-06',
    status: 'pending_leave',
    markedBy: 't-anjali',
    updatedAt: '09:09',
  },
  {
    id: 'att-3',
    slotId: 'slot-cse5a-mon-1',
    studentId: 's-meera',
    date: '2026-07-06',
    status: 'present',
    markedBy: 't-anjali',
    updatedAt: '09:07',
  },
  {
    id: 'att-4',
    slotId: 'slot-cse5a-mon-1',
    studentId: 's-arjun',
    date: '2026-07-06',
    status: 'absent',
    markedBy: 't-anjali',
    updatedAt: '09:10',
  },
]

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'LR-2201',
    studentId: 's-rahul',
    slotId: 'slot-cse5a-mon-1',
    date: '2026-07-06',
    reason: 'Medical appointment with certificate.',
    status: 'pending',
    reviewerId: 't-anjali',
    createdAt: '08:12',
  },
]
