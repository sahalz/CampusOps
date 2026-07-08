import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { normalizeValue, slugify } from './validation.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.CAMPUSOPS_DB_PATH ?? join(dataDir, 'campusops.sqlite')
const db = new DatabaseSync(dbPath)

const seedDepartments = [
  ['dept-cse', 'Computer Science', 'CSE', 'Prof. Anjali Rao', 'CS-214', 'active'],
  ['dept-it', 'Information Technology', 'IT', 'Prof. Ramesh Kumar', 'IT-108', 'active'],
  ['dept-civil', 'Civil Engineering', 'CE', 'Dr. Suresh Iyer', 'CE-201', 'active'],
  ['dept-mech', 'Mechanical Engineering', 'ME', 'Dr. Kavitha Raman', 'ME-118', 'active'],
  ['dept-fire', 'Fire and Safety Engineering', 'FSE', 'Dr. Arjun Varma', 'FS-104', 'active'],
  [
    'dept-eee',
    'Electrical and Electronics Engineering',
    'EEE',
    'Dr. Devika Nair',
    'EE-207',
    'active',
  ],
  [
    'dept-ece',
    'Electronics and Communication Engineering',
    'ECE',
    'Prof. Fatima Sheikh',
    'EC-102',
    'active',
  ],
]

const seedSubjects = [
  ['ms-cs501', 'dept-cse', 5, 'CS501', 'Data Structures', 4, 'theory', 'Prof. Anjali Rao', 'active'],
  ['ms-cs502', 'dept-cse', 5, 'CS502', 'Database Systems', 4, 'theory', 'Prof. Vikram Menon', 'active'],
  ['ms-cs503', 'dept-cse', 5, 'CS503', 'Artificial Intelligence', 3, 'elective', 'Prof. Anjali Rao', 'active'],
  ['ms-cs504l', 'dept-cse', 5, 'CS504L', 'Operating Systems Lab', 2, 'lab', 'Prof. Vikram Menon', 'active'],
  ['ms-it301', 'dept-it', 3, 'IT301', 'Web Engineering', 3, 'theory', 'Prof. Ramesh Kumar', 'active'],
  ['ms-it302', 'dept-it', 3, 'IT302', 'Cloud Computing Fundamentals', 3, 'elective', 'Prof. Latha N', 'active'],
  ['ms-ce301', 'dept-civil', 3, 'CE301', 'Structural Analysis', 4, 'theory', 'Dr. Suresh Iyer', 'active'],
  ['ms-ce302l', 'dept-civil', 3, 'CE302L', 'Surveying Lab', 2, 'lab', 'Dr. Nisha George', 'active'],
  ['ms-me301', 'dept-mech', 3, 'ME301', 'Thermodynamics', 4, 'theory', 'Dr. Kavitha Raman', 'active'],
  ['ms-me302', 'dept-mech', 3, 'ME302', 'Manufacturing Processes', 3, 'theory', 'Dr. Prakash Nair', 'active'],
  ['ms-fs301', 'dept-fire', 3, 'FS301', 'Fire Dynamics', 3, 'theory', 'Dr. Arjun Varma', 'active'],
  ['ms-fs302l', 'dept-fire', 3, 'FS302L', 'Industrial Safety Lab', 2, 'lab', 'Dr. Reena Mathew', 'active'],
  ['ms-ee301', 'dept-eee', 3, 'EE301', 'Power Systems', 4, 'theory', 'Dr. Devika Nair', 'active'],
  ['ms-ee302l', 'dept-eee', 3, 'EE302L', 'Electrical Machines Lab', 2, 'lab', 'Dr. Manoj Pillai', 'active'],
  ['ms-ec301', 'dept-ece', 3, 'EC301', 'Analog Circuits', 4, 'theory', 'Prof. Fatima Sheikh', 'active'],
  ['ms-ec302', 'dept-ece', 3, 'EC302', 'Digital Communication', 3, 'theory', 'Dr. Sameer Joseph', 'active'],
]

const seedAcademicTeachers = [
  ['t-anjali', 'Prof. Anjali Rao', 'Computer Science', 'anjali.rao@campus.edu'],
  ['t-vikram', 'Prof. Vikram Menon', 'Computer Science', 'vikram.menon@campus.edu'],
  ['t-fatima', 'Prof. Fatima Sheikh', 'Electronics', 'fatima.sheikh@campus.edu'],
  ['t-neha', 'Prof. Neha Iyer', 'Mathematics', 'neha.iyer@campus.edu'],
]

const seedAcademicSubjects = [
  ['sub-dsa', 'CS501', 'Data Structures', 'Computer Science'],
  ['sub-dbms', 'CS502', 'Database Systems', 'Computer Science'],
  ['sub-ai', 'CS503', 'Artificial Intelligence', 'Computer Science'],
  ['sub-dm', 'MA505', 'Discrete Mathematics', 'Mathematics'],
  ['sub-circuits', 'EC301', 'Analog Circuits', 'Electronics'],
]

const seedClassSections = [
  ['cse-5a', 'CSE-A', 'B.Tech CSE', 5, 't-anjali', 'B-204'],
  ['cse-5b', 'CSE-B', 'B.Tech CSE', 5, 't-vikram', 'B-205'],
  ['ece-3a', 'ECE-A', 'B.Tech ECE', 3, 't-fatima', 'E-102'],
]

const seedAcademicStudents = [
  ['s-aisha', 'CSE5A01', 'Aisha Khan', 'cse-5a', 'aisha.khan@campus.edu'],
  ['s-rahul', 'CSE5A02', 'Rahul Nair', 'cse-5a', 'rahul.nair@campus.edu'],
  ['s-meera', 'CSE5A03', 'Meera Shah', 'cse-5a', 'meera.shah@campus.edu'],
  ['s-arjun', 'CSE5A04', 'Arjun Pillai', 'cse-5a', 'arjun.pillai@campus.edu'],
  ['s-nikhil', 'CSE5B01', 'Nikhil Thomas', 'cse-5b', 'nikhil.thomas@campus.edu'],
  ['s-kavya', 'CSE5B02', 'Kavya Reddy', 'cse-5b', 'kavya.reddy@campus.edu'],
  ['s-zoya', 'ECE3A01', 'Zoya Fernandes', 'ece-3a', 'zoya.fernandes@campus.edu'],
  ['s-dev', 'ECE3A02', 'Dev Sharma', 'ece-3a', 'dev.sharma@campus.edu'],
]

const seedTimetableSlots = [
  ['slot-cse5a-mon-1', 'cse-5a', 'Monday', 1, '09:00', '10:00', 'sub-dsa', 't-anjali', 'B-204'],
  ['slot-cse5a-mon-2', 'cse-5a', 'Monday', 2, '10:00', '11:00', 'sub-dbms', 't-vikram', 'Lab-2'],
  ['slot-cse5a-mon-3', 'cse-5a', 'Monday', 3, '11:15', '12:15', 'sub-ai', 't-anjali', 'AI Lab'],
  ['slot-cse5a-tue-1', 'cse-5a', 'Tuesday', 1, '09:00', '10:00', 'sub-dm', 't-neha', 'B-204'],
  ['slot-cse5b-mon-1', 'cse-5b', 'Monday', 1, '09:00', '10:00', 'sub-dbms', 't-vikram', 'B-205'],
  ['slot-ece3a-mon-1', 'ece-3a', 'Monday', 1, '09:00', '10:00', 'sub-circuits', 't-fatima', 'E-102'],
]

const seedAttendanceRecords = [
  ['att-1', 'slot-cse5a-mon-1', 's-aisha', '2026-07-06', 'present', 't-anjali', '09:08'],
  ['att-2', 'slot-cse5a-mon-1', 's-rahul', '2026-07-06', 'pending_leave', 't-anjali', '09:09'],
  ['att-3', 'slot-cse5a-mon-1', 's-meera', '2026-07-06', 'present', 't-anjali', '09:07'],
  ['att-4', 'slot-cse5a-mon-1', 's-arjun', '2026-07-06', 'absent', 't-anjali', '09:10'],
]

const seedLeaveRequests = [
  [
    'LR-2201',
    's-rahul',
    'slot-cse5a-mon-1',
    '2026-07-06',
    'Medical appointment with certificate.',
    'pending',
    't-anjali',
    '08:12',
  ],
]

const seedStaffProfiles = [
  [
    'staff-anjali',
    't-anjali',
    'EMP-CS-014',
    'Prof. Anjali Rao',
    'Computer Science',
    'Assistant Professor',
    'anjali.rao@campus.edu',
    '+91 98765 22014',
    'active',
    '2021-06-14',
    'CS-214',
  ],
  [
    'staff-vikram',
    't-vikram',
    'EMP-CS-021',
    'Prof. Vikram Menon',
    'Computer Science',
    'Associate Professor',
    'vikram.menon@campus.edu',
    '+91 98765 22021',
    'active',
    '2019-07-01',
    'CS-208',
  ],
  [
    'staff-fatima',
    't-fatima',
    'EMP-EC-009',
    'Prof. Fatima Sheikh',
    'Electronics',
    'Assistant Professor',
    'fatima.sheikh@campus.edu',
    '+91 98765 33009',
    'on_leave',
    '2020-01-10',
    'EC-102',
  ],
  [
    'staff-neha',
    't-neha',
    'EMP-MA-006',
    'Prof. Neha Iyer',
    'Mathematics',
    'Senior Lecturer',
    'neha.iyer@campus.edu',
    '+91 98765 44006',
    'active',
    '2018-08-20',
    'MA-305',
  ],
]

const seedCirculars = [
  [
    'CIR-2026-071',
    'Semester 5 timetable lock for CSE sections',
    'The CSE semester 5 timetable is locked for this week. Attendance and leave requests should be raised against the mapped hour only.',
    'important',
    'department',
    null,
    'Computer Science',
    '2026-07-07',
    '2026-07-14',
    'semester-5-timetable.pdf',
    'Dr. Priya Menon',
  ],
  [
    'CIR-2026-072',
    'AI Lab unavailable during period 5',
    'AI Lab maintenance is scheduled today during period 5. Faculty should shift mapped practical sessions to the assigned backup room.',
    'urgent',
    'faculty',
    null,
    null,
    '2026-07-07',
    '2026-07-08',
    null,
    'Admin Office',
  ],
  [
    'CIR-2026-073',
    'CSE-A placement orientation',
    'CSE-A students must attend the placement orientation after regular classes. Attendance will be recorded separately by the placement cell.',
    'normal',
    'class',
    'cse-5a',
    null,
    '2026-07-06',
    '2026-07-12',
    'orientation-agenda.pdf',
    'Placement Cell',
  ],
  [
    'CIR-2026-074',
    'Library digital access renewal',
    'All students and faculty can renew digital library access from the portal before the end of this week.',
    'normal',
    'everyone',
    null,
    null,
    '2026-07-05',
    '2026-07-11',
    null,
    'Library Office',
  ],
]

const seedCircularReadReceipts = [
  ['CIR-2026-071', 't-anjali', '09:18'],
  ['CIR-2026-072', 't-vikram', '10:04'],
  ['CIR-2026-073', 's-aisha', '04:20 PM'],
  ['CIR-2026-074', 's-aisha', '04:24 PM'],
]

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    faculty_in_charge TEXT NOT NULL,
    office_room TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS departments_name_unique
    ON departments (lower(name));

  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits BETWEEN 0 AND 6),
    kind TEXT NOT NULL CHECK (kind IN ('theory', 'lab', 'elective')),
    default_faculty TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    outcome TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'critical')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS academic_teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS academic_subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS academic_class_sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    program TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 12),
    advisor_id TEXT NOT NULL REFERENCES academic_teachers(id) ON UPDATE CASCADE,
    room TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS academic_students (
    id TEXT PRIMARY KEY,
    roll_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class_section_id TEXT NOT NULL REFERENCES academic_class_sections(id) ON UPDATE CASCADE ON DELETE CASCADE,
    email TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS academic_timetable_slots (
    id TEXT PRIMARY KEY,
    class_section_id TEXT NOT NULL REFERENCES academic_class_sections(id) ON UPDATE CASCADE ON DELETE CASCADE,
    day TEXT NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject_id TEXT NOT NULL REFERENCES academic_subjects(id) ON UPDATE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES academic_teachers(id) ON UPDATE CASCADE,
    room TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS academic_attendance_records (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL REFERENCES academic_timetable_slots(id) ON UPDATE CASCADE ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES academic_students(id) ON UPDATE CASCADE ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'pending_leave')),
    marked_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS academic_leave_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES academic_students(id) ON UPDATE CASCADE ON DELETE CASCADE,
    slot_id TEXT NOT NULL REFERENCES academic_timetable_slots(id) ON UPDATE CASCADE ON DELETE CASCADE,
    date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS staff_profiles (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL UNIQUE,
    employee_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'on_leave', 'inactive')),
    joined_at TEXT NOT NULL,
    office_room TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS circulars (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')),
    audience_type TEXT NOT NULL CHECK (audience_type IN ('everyone', 'students', 'faculty', 'class', 'department')),
    audience_class_section_id TEXT,
    audience_department TEXT,
    published_at TEXT NOT NULL,
    expires_at TEXT,
    attachment_name TEXT,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS circular_read_receipts (
    circular_id TEXT NOT NULL REFERENCES circulars(id) ON UPDATE CASCADE ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    read_at TEXT NOT NULL,
    PRIMARY KEY (circular_id, actor_id)
  );
`)

const insertDepartmentStatement = db.prepare(`
  INSERT INTO departments (id, name, code, faculty_in_charge, office_room, status)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const insertSubjectStatement = db.prepare(`
  INSERT INTO subjects (
    id,
    department_id,
    semester,
    code,
    name,
    credits,
    kind,
    default_faculty,
    status
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAcademicTeacherStatement = db.prepare(`
  INSERT INTO academic_teachers (id, name, department, email)
  VALUES (?, ?, ?, ?)
`)

const insertAcademicSubjectStatement = db.prepare(`
  INSERT INTO academic_subjects (id, code, name, department)
  VALUES (?, ?, ?, ?)
`)

const insertClassSectionStatement = db.prepare(`
  INSERT INTO academic_class_sections (id, name, program, semester, advisor_id, room)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const insertAcademicStudentStatement = db.prepare(`
  INSERT INTO academic_students (id, roll_no, name, class_section_id, email)
  VALUES (?, ?, ?, ?, ?)
`)

const insertTimetableSlotStatement = db.prepare(`
  INSERT INTO academic_timetable_slots (
    id,
    class_section_id,
    day,
    period_number,
    start_time,
    end_time,
    subject_id,
    teacher_id,
    room
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAttendanceRecordStatement = db.prepare(`
  INSERT INTO academic_attendance_records (id, slot_id, student_id, date, status, marked_by, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const insertLeaveRequestStatement = db.prepare(`
  INSERT INTO academic_leave_requests (id, student_id, slot_id, date, reason, status, reviewer_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertStaffProfileStatement = db.prepare(`
  INSERT INTO staff_profiles (
    id,
    teacher_id,
    employee_code,
    name,
    department,
    designation,
    email,
    phone,
    status,
    joined_at,
    office_room
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertCircularStatement = db.prepare(`
  INSERT INTO circulars (
    id,
    title,
    body,
    priority,
    audience_type,
    audience_class_section_id,
    audience_department,
    published_at,
    expires_at,
    attachment_name,
    created_by
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertCircularReadReceiptStatement = db.prepare(`
  INSERT OR REPLACE INTO circular_read_receipts (circular_id, actor_id, read_at)
  VALUES (?, ?, ?)
`)

function seedIfNeeded() {
  const departmentCount = db.prepare('SELECT COUNT(*) AS count FROM departments').get().count
  const subjectCount = db.prepare('SELECT COUNT(*) AS count FROM subjects').get().count

  if (departmentCount === 0) {
    seedDepartments.forEach((department) => insertDepartmentStatement.run(...department))
  }

  if (subjectCount === 0) {
    seedSubjects.forEach((subject) => insertSubjectStatement.run(...subject))
  }

  const academicTeacherCount = db.prepare('SELECT COUNT(*) AS count FROM academic_teachers').get().count
  if (academicTeacherCount === 0) {
    seedAcademicTeachers.forEach((teacher) => insertAcademicTeacherStatement.run(...teacher))
    seedAcademicSubjects.forEach((subject) => insertAcademicSubjectStatement.run(...subject))
    seedClassSections.forEach((section) => insertClassSectionStatement.run(...section))
    seedAcademicStudents.forEach((student) => insertAcademicStudentStatement.run(...student))
    seedTimetableSlots.forEach((slot) => insertTimetableSlotStatement.run(...slot))
    seedAttendanceRecords.forEach((record) => insertAttendanceRecordStatement.run(...record))
    seedLeaveRequests.forEach((request) => insertLeaveRequestStatement.run(...request))
  }

  const staffProfileCount = db.prepare('SELECT COUNT(*) AS count FROM staff_profiles').get().count
  if (staffProfileCount === 0) {
    seedStaffProfiles.forEach((profile) => insertStaffProfileStatement.run(...profile))
  }

  const circularCount = db.prepare('SELECT COUNT(*) AS count FROM circulars').get().count
  if (circularCount === 0) {
    seedCirculars.forEach((circular) => insertCircularStatement.run(...circular))
    seedCircularReadReceipts.forEach((receipt) => insertCircularReadReceiptStatement.run(...receipt))
  }
}

seedIfNeeded()

function makeReadableId(prefix, value) {
  const slug = slugify(value) || randomUUID().slice(0, 8)
  return `${prefix}-${slug}-${Date.now().toString(36)}`
}

export function getDepartments() {
  return db
    .prepare(`
      SELECT
        id,
        name,
        code,
        faculty_in_charge AS facultyInCharge,
        office_room AS officeRoom,
        status
      FROM departments
      ORDER BY status, name
    `)
    .all()
}

export function getDepartmentById(id) {
  return db
    .prepare(`
      SELECT
        id,
        name,
        code,
        faculty_in_charge AS facultyInCharge,
        office_room AS officeRoom,
        status
      FROM departments
      WHERE id = ?
    `)
    .get(id)
}

export function getSubjects() {
  return db
    .prepare(`
      SELECT
        id,
        department_id AS departmentId,
        semester,
        code,
        name,
        credits,
        kind,
        default_faculty AS defaultFaculty,
        status
      FROM subjects
      ORDER BY department_id, semester, code
    `)
    .all()
}

export function getSubjectById(id) {
  return db
    .prepare(`
      SELECT
        id,
        department_id AS departmentId,
        semester,
        code,
        name,
        credits,
        kind,
        default_faculty AS defaultFaculty,
        status
      FROM subjects
      WHERE id = ?
    `)
    .get(id)
}

export function getMasterData() {
  return {
    version: 1,
    departments: getDepartments(),
    subjects: getSubjects(),
  }
}

export function createDepartment(draft) {
  const id = makeReadableId('dept', draft.code || draft.name)
  insertDepartmentStatement.run(id, draft.name, draft.code, draft.facultyInCharge, draft.officeRoom, draft.status)
  return getDepartmentById(id)
}

export function updateDepartment(id, draft) {
  const result = db
    .prepare(`
      UPDATE departments
      SET
        name = ?,
        code = ?,
        faculty_in_charge = ?,
        office_room = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(draft.name, draft.code, draft.facultyInCharge, draft.officeRoom, draft.status, id)

  return result.changes > 0 ? getDepartmentById(id) : null
}

export function createSubject(draft) {
  const id = makeReadableId('ms', draft.code || draft.name)
  insertSubjectStatement.run(
    id,
    draft.departmentId,
    draft.semester,
    draft.code,
    draft.name,
    draft.credits,
    draft.kind,
    draft.defaultFaculty,
    draft.status,
  )
  return getSubjectById(id)
}

export function updateSubject(id, draft) {
  const result = db
    .prepare(`
      UPDATE subjects
      SET
        department_id = ?,
        semester = ?,
        code = ?,
        name = ?,
        credits = ?,
        kind = ?,
        default_faculty = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(
      draft.departmentId,
      draft.semester,
      draft.code,
      draft.name,
      draft.credits,
      draft.kind,
      draft.defaultFaculty,
      draft.status,
      id,
    )

  return result.changes > 0 ? getSubjectById(id) : null
}

export function resetMasterData() {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM subjects')
    db.exec('DELETE FROM departments')
    seedDepartments.forEach((department) => insertDepartmentStatement.run(...department))
    seedSubjects.forEach((subject) => insertSubjectStatement.run(...subject))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getMasterData()
}

export function getAuditEvents(limit = 40) {
  return db
    .prepare(`
      SELECT id, time, actor, action, outcome, severity
      FROM audit_events
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `)
    .all(limit)
}

export function createAuditEvent(event) {
  const auditEvent = {
    id: event.id || `AUD-${Date.now()}-${randomUUID().slice(0, 8)}`,
    time: String(event.time ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    actor: String(event.actor ?? 'CampusOps'),
    action: String(event.action ?? 'Recorded event'),
    outcome: String(event.outcome ?? 'Event recorded.'),
    severity: ['info', 'success', 'warning', 'critical'].includes(event.severity) ? event.severity : 'info',
  }

  db.prepare(`
    INSERT OR REPLACE INTO audit_events (id, time, actor, action, outcome, severity)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    auditEvent.id,
    auditEvent.time,
    auditEvent.actor,
    auditEvent.action,
    auditEvent.outcome,
    auditEvent.severity,
  )

  return auditEvent
}

export function getAcademicState() {
  return {
    version: 2,
    classSections: db
      .prepare(`
        SELECT
          id,
          name,
          program,
          semester,
          advisor_id AS advisorId,
          room
        FROM academic_class_sections
        ORDER BY name
      `)
      .all(),
    students: db
      .prepare(`
        SELECT
          id,
          roll_no AS rollNo,
          name,
          class_section_id AS classSectionId,
          email
        FROM academic_students
        ORDER BY roll_no
      `)
      .all(),
    teachers: db
      .prepare(`
        SELECT id, name, department, email
        FROM academic_teachers
        ORDER BY name
      `)
      .all(),
    subjects: db
      .prepare(`
        SELECT id, code, name, department
        FROM academic_subjects
        ORDER BY code
      `)
      .all(),
    slots: db
      .prepare(`
        SELECT
          id,
          class_section_id AS classSectionId,
          day,
          period_number AS periodNumber,
          start_time AS startTime,
          end_time AS endTime,
          subject_id AS subjectId,
          teacher_id AS teacherId,
          room
        FROM academic_timetable_slots
        ORDER BY day, period_number, class_section_id
      `)
      .all(),
    attendance: db
      .prepare(`
        SELECT
          id,
          slot_id AS slotId,
          student_id AS studentId,
          date,
          status,
          marked_by AS markedBy,
          updated_at AS updatedAt
        FROM academic_attendance_records
        ORDER BY date DESC, id DESC
      `)
      .all(),
    leaves: db
      .prepare(`
        SELECT
          id,
          student_id AS studentId,
          slot_id AS slotId,
          date,
          reason,
          status,
          reviewer_id AS reviewerId,
          created_at AS createdAt
        FROM academic_leave_requests
        ORDER BY date DESC, id DESC
      `)
      .all(),
  }
}

function safeString(value) {
  return String(value ?? '').trim()
}

function assertAcademicStateShape(state) {
  const collections = ['classSections', 'students', 'teachers', 'subjects', 'slots', 'attendance', 'leaves']
  const missingCollection = collections.find((collection) => !Array.isArray(state?.[collection]))

  if (missingCollection) {
    throw new Error(`Academic state is missing ${missingCollection}.`)
  }
}

function clearAcademicTables() {
  db.exec(`
    DELETE FROM academic_leave_requests;
    DELETE FROM academic_attendance_records;
    DELETE FROM academic_timetable_slots;
    DELETE FROM academic_students;
    DELETE FROM academic_class_sections;
    DELETE FROM academic_subjects;
    DELETE FROM academic_teachers;
  `)
}

function insertAcademicSeedData() {
  seedAcademicTeachers.forEach((teacher) => insertAcademicTeacherStatement.run(...teacher))
  seedAcademicSubjects.forEach((subject) => insertAcademicSubjectStatement.run(...subject))
  seedClassSections.forEach((section) => insertClassSectionStatement.run(...section))
  seedAcademicStudents.forEach((student) => insertAcademicStudentStatement.run(...student))
  seedTimetableSlots.forEach((slot) => insertTimetableSlotStatement.run(...slot))
  seedAttendanceRecords.forEach((record) => insertAttendanceRecordStatement.run(...record))
  seedLeaveRequests.forEach((request) => insertLeaveRequestStatement.run(...request))
}

export function saveAcademicState(state) {
  assertAcademicStateShape(state)

  db.exec('BEGIN')
  try {
    clearAcademicTables()

    state.teachers.forEach((teacher) => {
      insertAcademicTeacherStatement.run(
        safeString(teacher.id),
        safeString(teacher.name),
        safeString(teacher.department),
        safeString(teacher.email),
      )
    })

    state.subjects.forEach((subject) => {
      insertAcademicSubjectStatement.run(
        safeString(subject.id),
        safeString(subject.code),
        safeString(subject.name),
        safeString(subject.department),
      )
    })

    state.classSections.forEach((section) => {
      insertClassSectionStatement.run(
        safeString(section.id),
        safeString(section.name),
        safeString(section.program),
        Number(section.semester),
        safeString(section.advisorId),
        safeString(section.room),
      )
    })

    state.students.forEach((student) => {
      insertAcademicStudentStatement.run(
        safeString(student.id),
        safeString(student.rollNo),
        safeString(student.name),
        safeString(student.classSectionId),
        safeString(student.email),
      )
    })

    state.slots.forEach((slot) => {
      insertTimetableSlotStatement.run(
        safeString(slot.id),
        safeString(slot.classSectionId),
        safeString(slot.day),
        Number(slot.periodNumber),
        safeString(slot.startTime),
        safeString(slot.endTime),
        safeString(slot.subjectId),
        safeString(slot.teacherId),
        safeString(slot.room),
      )
    })

    state.attendance.forEach((record) => {
      insertAttendanceRecordStatement.run(
        safeString(record.id),
        safeString(record.slotId),
        safeString(record.studentId),
        safeString(record.date),
        safeString(record.status),
        safeString(record.markedBy),
        safeString(record.updatedAt),
      )
    })

    state.leaves.forEach((leave) => {
      insertLeaveRequestStatement.run(
        safeString(leave.id),
        safeString(leave.studentId),
        safeString(leave.slotId),
        safeString(leave.date),
        safeString(leave.reason),
        safeString(leave.status),
        safeString(leave.reviewerId),
        safeString(leave.createdAt),
      )
    })

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getAcademicState()
}

export function resetAcademicData() {
  db.exec('BEGIN')
  try {
    clearAcademicTables()
    insertAcademicSeedData()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getAcademicState()
}

const staffStatuses = new Set(['active', 'on_leave', 'inactive'])
const circularPriorities = new Set(['normal', 'important', 'urgent'])
const circularAudienceTypes = new Set(['everyone', 'students', 'faculty', 'class', 'department'])

function currentDateString() {
  return new Date().toISOString().slice(0, 10)
}

function nullableString(value) {
  const text = safeString(value)
  return text || null
}

function cleanStaffProfileInput(input, fallback = {}) {
  return {
    teacherId: safeString(input?.teacherId ?? fallback.teacherId),
    employeeCode: safeString(input?.employeeCode ?? fallback.employeeCode).toUpperCase(),
    name: safeString(input?.name ?? fallback.name).replace(/\s+/g, ' '),
    department: safeString(input?.department ?? fallback.department).replace(/\s+/g, ' '),
    designation: safeString(input?.designation ?? fallback.designation).replace(/\s+/g, ' '),
    email: safeString(input?.email ?? fallback.email).toLowerCase(),
    phone: safeString(input?.phone ?? fallback.phone),
    status: staffStatuses.has(input?.status) ? input.status : fallback.status ?? 'active',
    joinedAt: safeString(input?.joinedAt ?? fallback.joinedAt) || currentDateString(),
    officeRoom: safeString(input?.officeRoom ?? fallback.officeRoom).replace(/\s+/g, ' '),
  }
}

function makeTeacherId(input) {
  return safeString(input.teacherId) || `t-${slugify(input.email || input.employeeCode || input.name) || randomUUID().slice(0, 8)}`
}

export function getStaffProfiles() {
  return db
    .prepare(`
      SELECT
        id,
        teacher_id AS teacherId,
        employee_code AS employeeCode,
        name,
        department,
        designation,
        email,
        phone,
        status,
        joined_at AS joinedAt,
        office_room AS officeRoom
      FROM staff_profiles
      ORDER BY department, name
    `)
    .all()
}

export function getStaffProfileById(id) {
  return db
    .prepare(`
      SELECT
        id,
        teacher_id AS teacherId,
        employee_code AS employeeCode,
        name,
        department,
        designation,
        email,
        phone,
        status,
        joined_at AS joinedAt,
        office_room AS officeRoom
      FROM staff_profiles
      WHERE id = ?
    `)
    .get(id)
}

export function getStaffState() {
  return {
    version: 1,
    staffProfiles: getStaffProfiles(),
  }
}

export function createStaffProfile(input) {
  const draft = cleanStaffProfileInput(input)
  const teacherId = makeTeacherId(draft)
  const id = safeString(input?.id) || makeReadableId('staff', draft.employeeCode || draft.name)

  insertStaffProfileStatement.run(
    id,
    teacherId,
    draft.employeeCode,
    draft.name,
    draft.department,
    draft.designation,
    draft.email,
    draft.phone,
    draft.status,
    draft.joinedAt,
    draft.officeRoom,
  )

  return getStaffProfileById(id)
}

export function updateStaffProfile(id, input) {
  const existing = getStaffProfileById(id)
  if (!existing) {
    return null
  }

  const draft = cleanStaffProfileInput(input, existing)
  const teacherId = makeTeacherId({ ...draft, teacherId: existing.teacherId })
  const result = db
    .prepare(`
      UPDATE staff_profiles
      SET
        teacher_id = ?,
        employee_code = ?,
        name = ?,
        department = ?,
        designation = ?,
        email = ?,
        phone = ?,
        status = ?,
        joined_at = ?,
        office_room = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(
      teacherId,
      draft.employeeCode,
      draft.name,
      draft.department,
      draft.designation,
      draft.email,
      draft.phone,
      draft.status,
      draft.joinedAt,
      draft.officeRoom,
      id,
    )

  return result.changes > 0 ? getStaffProfileById(id) : null
}

export function resetStaffData() {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM staff_profiles')
    seedStaffProfiles.forEach((profile) => insertStaffProfileStatement.run(...profile))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getStaffState()
}

function normalizeCircularAudience(input) {
  const audience = input?.audience ?? {}
  const type = circularAudienceTypes.has(audience.type) ? audience.type : 'everyone'

  return {
    type,
    classSectionId: type === 'class' ? safeString(audience.classSectionId) : '',
    department: type === 'department' ? safeString(audience.department).replace(/\s+/g, ' ') : '',
  }
}

function cleanCircularInput(input) {
  const audience = normalizeCircularAudience(input)

  return {
    id: safeString(input?.id),
    title: safeString(input?.title).replace(/\s+/g, ' '),
    body: safeString(input?.body).replace(/\s+/g, ' '),
    priority: circularPriorities.has(input?.priority) ? input.priority : 'normal',
    audience,
    publishedAt: safeString(input?.publishedAt) || currentDateString(),
    expiresAt: nullableString(input?.expiresAt),
    attachmentName: nullableString(input?.attachmentName),
    createdBy: safeString(input?.createdBy) || 'Admin Office',
  }
}

function rowToCircular(row) {
  let audience = { type: row.audienceType }
  if (row.audienceType === 'class') {
    audience = {
      type: 'class',
      classSectionId: row.audienceClassSectionId,
    }
  }

  if (row.audienceType === 'department') {
    audience = {
      type: 'department',
      department: row.audienceDepartment,
    }
  }

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    audience,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt ?? undefined,
    attachmentName: row.attachmentName ?? undefined,
    createdBy: row.createdBy,
  }
}

export function getCirculars() {
  return db
    .prepare(`
      SELECT
        id,
        title,
        body,
        priority,
        audience_type AS audienceType,
        audience_class_section_id AS audienceClassSectionId,
        audience_department AS audienceDepartment,
        published_at AS publishedAt,
        expires_at AS expiresAt,
        attachment_name AS attachmentName,
        created_by AS createdBy
      FROM circulars
      ORDER BY published_at DESC, id DESC
    `)
    .all()
    .map(rowToCircular)
}

export function getCircularReadReceipts() {
  return db
    .prepare(`
      SELECT
        circular_id AS circularId,
        actor_id AS actorId,
        read_at AS readAt
      FROM circular_read_receipts
      ORDER BY circular_id, actor_id
    `)
    .all()
}

export function getCircularState() {
  return {
    version: 1,
    circulars: getCirculars(),
    readReceipts: getCircularReadReceipts(),
  }
}

export function createCircular(input) {
  const draft = cleanCircularInput(input)
  const id = draft.id || `CIR-${Date.now().toString(36).toUpperCase()}`

  insertCircularStatement.run(
    id,
    draft.title,
    draft.body,
    draft.priority,
    draft.audience.type,
    nullableString(draft.audience.classSectionId),
    nullableString(draft.audience.department),
    draft.publishedAt,
    draft.expiresAt,
    draft.attachmentName,
    draft.createdBy,
  )

  return getCirculars().find((circular) => circular.id === id)
}

export function createCircularReadReceipt(input) {
  const receipt = {
    circularId: safeString(input?.circularId),
    actorId: safeString(input?.actorId),
    readAt: safeString(input?.readAt) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }

  insertCircularReadReceiptStatement.run(receipt.circularId, receipt.actorId, receipt.readAt)
  return receipt
}

export function createCircularReadReceipts(receipts) {
  if (!Array.isArray(receipts)) {
    return []
  }

  db.exec('BEGIN')
  try {
    receipts.forEach((receipt) => {
      const cleanReceipt = {
        circularId: safeString(receipt?.circularId),
        actorId: safeString(receipt?.actorId),
        readAt: safeString(receipt?.readAt) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      insertCircularReadReceiptStatement.run(cleanReceipt.circularId, cleanReceipt.actorId, cleanReceipt.readAt)
    })
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getCircularReadReceipts()
}

export function resetCircularData() {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM circular_read_receipts')
    db.exec('DELETE FROM circulars')
    seedCirculars.forEach((circular) => insertCircularStatement.run(...circular))
    seedCircularReadReceipts.forEach((receipt) => insertCircularReadReceiptStatement.run(...receipt))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getCircularState()
}

function normalizeReportFilters(filters = {}) {
  return {
    department: safeString(filters.department) || 'all',
    semester: safeString(filters.semester) || 'all',
    date: safeString(filters.date),
    status: safeString(filters.status) || 'all',
    role: safeString(filters.role) || 'admin',
    actorId: safeString(filters.actorId),
  }
}

function reportDepartmentMatches(value, filter) {
  if (!filter || filter === 'all') {
    return true
  }

  const normalizedValue = normalizeValue(value)
  const normalizedFilter = normalizeValue(filter)
  return normalizedValue === normalizedFilter || normalizedValue.includes(normalizedFilter)
}

function reportSemesterMatches(value, filter) {
  return !filter || filter === 'all' || String(value) === String(filter)
}

function normalizeDepartmentName(value) {
  const normalized = normalizeValue(value)

  if (normalized.includes('cse') || normalized.includes('computer')) {
    return 'Computer Science'
  }

  if (normalized.includes('ece') || normalized.includes('electronic')) {
    return 'Electronics'
  }

  if (normalized.includes('math')) {
    return 'Mathematics'
  }

  return value || 'Unmapped'
}

function isCircularActive(circular, date = currentDateString()) {
  return !circular.expiresAt || circular.expiresAt >= date
}

function getReportContext() {
  const academic = getAcademicState()
  const masterDepartments = getDepartments()
  const masterSubjects = getSubjects()
  const staffProfiles = getStaffProfiles()
  const circularState = getCircularState()

  return {
    ...academic,
    masterDepartments,
    masterSubjects,
    staffProfiles,
    circulars: circularState.circulars,
    readReceipts: circularState.readReceipts,
  }
}

function buildIndexes(context) {
  return {
    sectionById: new Map(context.classSections.map((section) => [section.id, section])),
    studentById: new Map(context.students.map((student) => [student.id, student])),
    teacherById: new Map(context.teachers.map((teacher) => [teacher.id, teacher])),
    subjectById: new Map(context.subjects.map((subject) => [subject.id, subject])),
    slotById: new Map(context.slots.map((slot) => [slot.id, slot])),
    masterDepartmentById: new Map(context.masterDepartments.map((department) => [department.id, department])),
  }
}

function getSlotDepartment(slot, indexes) {
  const subject = indexes.subjectById.get(slot?.subjectId)
  const section = indexes.sectionById.get(slot?.classSectionId)
  return normalizeDepartmentName(subject?.department || section?.program || '')
}

function getAttendanceShortageReport(context, filters) {
  const indexes = buildIndexes(context)
  const grouped = new Map()

  context.attendance.forEach((record) => {
    if (filters.date && record.date !== filters.date) {
      return
    }

    const slot = indexes.slotById.get(record.slotId)
    const student = indexes.studentById.get(record.studentId)
    const section = indexes.sectionById.get(student?.classSectionId)
    if (!slot || !student || !section) {
      return
    }

    const department = getSlotDepartment(slot, indexes)
    if (!reportDepartmentMatches(department, filters.department) || !reportSemesterMatches(section.semester, filters.semester)) {
      return
    }

    const existing = grouped.get(student.id) ?? {
      studentId: student.id,
      rollNo: student.rollNo,
      studentName: student.name,
      className: section.name,
      semester: section.semester,
      department,
      totalMarked: 0,
      attended: 0,
      missed: 0,
      lastMarkedDate: record.date,
      status: 'shortage',
    }

    existing.totalMarked += 1
    if (record.status === 'present' || record.status === 'excused') {
      existing.attended += 1
    } else {
      existing.missed += 1
    }
    existing.lastMarkedDate = record.date > existing.lastMarkedDate ? record.date : existing.lastMarkedDate
    grouped.set(student.id, existing)
  })

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      attendancePercent: row.totalMarked > 0 ? Math.round((row.attended / row.totalMarked) * 100) : 0,
    }))
    .filter((row) => row.totalMarked > 0 && row.attendancePercent < 75)
    .filter((row) => filters.status === 'all' || filters.status === 'shortage')
    .sort((first, second) => first.attendancePercent - second.attendancePercent || first.rollNo.localeCompare(second.rollNo))
}

function getPendingLeaveReport(context, filters) {
  const indexes = buildIndexes(context)
  const requestedStatus = ['pending', 'approved', 'rejected'].includes(filters.status) ? filters.status : 'pending'

  return context.leaves
    .filter((leave) => leave.status === requestedStatus)
    .filter((leave) => !filters.date || leave.date === filters.date)
    .filter((leave) => filters.role !== 'faculty' || !filters.actorId || leave.reviewerId === filters.actorId)
    .map((leave) => {
      const student = indexes.studentById.get(leave.studentId)
      const slot = indexes.slotById.get(leave.slotId)
      const section = indexes.sectionById.get(student?.classSectionId)
      const subject = indexes.subjectById.get(slot?.subjectId)
      const reviewer = indexes.teacherById.get(leave.reviewerId)
      const department = normalizeDepartmentName(subject?.department || section?.program || '')

      return {
        id: leave.id,
        studentName: student?.name ?? 'Unknown student',
        rollNo: student?.rollNo ?? 'N/A',
        className: section?.name ?? 'N/A',
        semester: section?.semester ?? 0,
        department,
        subjectName: subject?.name ?? 'Unmapped subject',
        date: leave.date,
        periodNumber: slot?.periodNumber ?? 0,
        reviewerName: reviewer?.name ?? leave.reviewerId,
        reason: leave.reason,
        status: leave.status,
        createdAt: leave.createdAt,
      }
    })
    .filter((row) => reportDepartmentMatches(row.department, filters.department))
    .filter((row) => reportSemesterMatches(row.semester, filters.semester))
    .sort((first, second) => first.date.localeCompare(second.date) || first.periodNumber - second.periodNumber)
}

function getFacultyWorkloadReport(context, filters) {
  const indexes = buildIndexes(context)
  const staffByTeacherId = new Map(context.staffProfiles.map((staff) => [staff.teacherId, staff]))
  const highLoadThreshold = 2

  return context.teachers
    .map((teacher) => {
      const staff = staffByTeacherId.get(teacher.id)
      const teacherSlots = context.slots.filter((slot) => slot.teacherId === teacher.id)
      const subjectNames = new Set(
        teacherSlots.map((slot) => indexes.subjectById.get(slot.subjectId)?.name).filter(Boolean),
      )
      const classNames = new Set(
        teacherSlots.map((slot) => indexes.sectionById.get(slot.classSectionId)?.name).filter(Boolean),
      )
      const department = staff?.department ?? teacher.department
      const loadStatus = teacherSlots.length >= highLoadThreshold ? 'overloaded' : 'normal'

      return {
        teacherId: teacher.id,
        employeeCode: staff?.employeeCode ?? 'N/A',
        teacherName: teacher.name,
        department,
        designation: staff?.designation ?? 'Faculty',
        staffStatus: staff?.status ?? 'active',
        assignedSlots: teacherSlots.length,
        uniqueSubjects: subjectNames.size,
        classSections: classNames.size,
        loadStatus,
      }
    })
    .filter((row) => filters.role !== 'faculty' || !filters.actorId || row.teacherId === filters.actorId)
    .filter((row) => reportDepartmentMatches(row.department, filters.department))
    .filter((row) => {
      if (filters.status === 'overloaded') {
        return row.loadStatus === 'overloaded'
      }

      if (staffStatuses.has(filters.status)) {
        return row.staffStatus === filters.status
      }

      return true
    })
    .sort((first, second) => second.assignedSlots - first.assignedSlots || first.teacherName.localeCompare(second.teacherName))
}

function getDepartmentSubjectCoverageReport(context, filters) {
  const timetableSubjectCodes = new Set(
    context.slots
      .map((slot) => context.subjects.find((subject) => subject.id === slot.subjectId)?.code)
      .filter(Boolean),
  )
  const departments = new Map(context.masterDepartments.map((department) => [department.id, department]))
  const grouped = new Map()

  context.masterSubjects.forEach((subject) => {
    const department = departments.get(subject.departmentId)
    const departmentName = department?.name ?? 'Unmapped department'
    if (!reportDepartmentMatches(departmentName, filters.department) || !reportSemesterMatches(subject.semester, filters.semester)) {
      return
    }

    const key = `${subject.departmentId}:${subject.semester}`
    const existing = grouped.get(key) ?? {
      departmentId: subject.departmentId,
      departmentName,
      departmentCode: department?.code ?? 'N/A',
      semester: subject.semester,
      totalSubjects: 0,
      mappedSubjects: 0,
      unmappedSubjects: 0,
      unmappedSubjectCodes: [],
      status: 'covered',
    }

    existing.totalSubjects += 1
    if (timetableSubjectCodes.has(subject.code)) {
      existing.mappedSubjects += 1
    } else {
      existing.unmappedSubjects += 1
      existing.unmappedSubjectCodes.push(subject.code)
      existing.status = 'unmapped'
    }

    grouped.set(key, existing)
  })

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      coveragePercent: row.totalSubjects > 0 ? Math.round((row.mappedSubjects / row.totalSubjects) * 100) : 0,
      unmappedSubjectCodes: row.unmappedSubjectCodes.join(', '),
    }))
    .filter((row) => filters.status !== 'unmapped' || row.unmappedSubjects > 0)
    .sort((first, second) => first.departmentName.localeCompare(second.departmentName) || first.semester - second.semester)
}

function getInactiveMasterDataReport(context, filters) {
  const departments = context.masterDepartments
    .filter((department) => department.status === 'inactive')
    .filter((department) => reportDepartmentMatches(department.name, filters.department))
    .map((department) => ({
      id: department.id,
      type: 'Department',
      name: department.name,
      code: department.code,
      owner: department.facultyInCharge,
      status: department.status,
      detail: department.officeRoom,
    }))

  const departmentById = new Map(context.masterDepartments.map((department) => [department.id, department]))
  const subjects = context.masterSubjects
    .filter((subject) => subject.status === 'inactive')
    .filter((subject) => reportSemesterMatches(subject.semester, filters.semester))
    .filter((subject) => reportDepartmentMatches(departmentById.get(subject.departmentId)?.name ?? '', filters.department))
    .map((subject) => ({
      id: subject.id,
      type: 'Subject',
      name: subject.name,
      code: subject.code,
      owner: subject.defaultFaculty,
      status: subject.status,
      detail: `${departmentById.get(subject.departmentId)?.code ?? 'N/A'} / Sem ${subject.semester}`,
    }))

  return [...departments, ...subjects]
    .filter((row) => filters.status === 'all' || filters.status === 'inactive')
    .sort((first, second) => first.type.localeCompare(second.type) || first.name.localeCompare(second.name))
}

function getCircularAudienceActors(circular, context) {
  if (circular.audience.type === 'students') {
    return context.students.map((student) => student.id)
  }

  if (circular.audience.type === 'faculty') {
    return context.teachers.map((teacher) => teacher.id)
  }

  if (circular.audience.type === 'class') {
    return context.students
      .filter((student) => student.classSectionId === circular.audience.classSectionId)
      .map((student) => student.id)
  }

  if (circular.audience.type === 'department') {
    const targetDepartment = normalizeValue(circular.audience.department)
    const sectionById = new Map(context.classSections.map((section) => [section.id, section]))
    const studentActors = context.students
      .filter((student) => {
        const section = sectionById.get(student.classSectionId)
        return normalizeValue(normalizeDepartmentName(section?.program ?? '')) === targetDepartment
      })
      .map((student) => student.id)
    const facultyActors = context.teachers
      .filter((teacher) => normalizeValue(normalizeDepartmentName(teacher.department)) === targetDepartment)
      .map((teacher) => teacher.id)

    return [...studentActors, ...facultyActors]
  }

  return [...context.students.map((student) => student.id), ...context.teachers.map((teacher) => teacher.id)]
}

function getCircularEngagementReport(context, filters) {
  const receiptsByCircular = new Map()
  context.readReceipts.forEach((receipt) => {
    const receipts = receiptsByCircular.get(receipt.circularId) ?? new Set()
    receipts.add(receipt.actorId)
    receiptsByCircular.set(receipt.circularId, receipts)
  })

  return context.circulars
    .filter((circular) => !filters.date || circular.publishedAt === filters.date)
    .filter((circular) => {
      if (filters.department === 'all') {
        return true
      }

      return circular.audience.type === 'department'
        ? reportDepartmentMatches(circular.audience.department, filters.department)
        : true
    })
    .map((circular) => {
      const audienceActors = getCircularAudienceActors(circular, context)
      const receipts = receiptsByCircular.get(circular.id) ?? new Set()
      const readCount = audienceActors.filter((actorId) => receipts.has(actorId)).length
      const targetCount = audienceActors.length
      const unreadCount = Math.max(targetCount - readCount, 0)

      return {
        id: circular.id,
        title: circular.title,
        priority: circular.priority,
        audience: circular.audience.type === 'department'
          ? circular.audience.department
          : circular.audience.type === 'class'
            ? circular.audience.classSectionId
            : circular.audience.type,
        publishedAt: circular.publishedAt,
        active: isCircularActive(circular),
        targetCount,
        readCount,
        unreadCount,
        readRate: targetCount > 0 ? Math.round((readCount / targetCount) * 100) : 100,
        status: unreadCount > 0 ? 'unread' : 'read',
      }
    })
    .filter((row) => filters.status !== 'unread' || row.unreadCount > 0)
    .sort((first, second) => second.unreadCount - first.unreadCount || second.publishedAt.localeCompare(first.publishedAt))
}

function getDailyOperationsSummary(context, filters) {
  const attendanceDates = context.attendance.map((record) => record.date).sort()
  const selectedDate = filters.date || attendanceDates.at(-1) || currentDateString()
  const recordsForDate = context.attendance.filter((record) => record.date === selectedDate)
  const circularEngagement = getCircularEngagementReport(context, { ...filters, date: '' })

  return {
    date: selectedDate,
    markedAttendanceCount: recordsForDate.length,
    presentCount: recordsForDate.filter((record) => record.status === 'present').length,
    absentCount: recordsForDate.filter((record) => record.status === 'absent').length,
    pendingLeaveAttendanceCount: recordsForDate.filter((record) => record.status === 'pending_leave').length,
    pendingLeaveRequests: context.leaves.filter((leave) => leave.status === 'pending').length,
    activeCirculars: context.circulars.filter((circular) => isCircularActive(circular, selectedDate)).length,
    unreadCircularReceipts: circularEngagement.reduce((total, row) => total + row.unreadCount, 0),
    activeDepartments: context.masterDepartments.filter((department) => department.status === 'active').length,
    activeSubjects: context.masterSubjects.filter((subject) => subject.status === 'active').length,
  }
}

function getReportFilterOptions(context) {
  const departmentNames = new Set()
  context.masterDepartments.forEach((department) => departmentNames.add(department.name))
  context.teachers.forEach((teacher) => departmentNames.add(normalizeDepartmentName(teacher.department)))
  context.staffProfiles.forEach((staff) => departmentNames.add(normalizeDepartmentName(staff.department)))

  const semesters = new Set()
  context.classSections.forEach((section) => semesters.add(section.semester))
  context.masterSubjects.forEach((subject) => semesters.add(subject.semester))

  const dates = new Set()
  context.attendance.forEach((record) => dates.add(record.date))
  context.leaves.forEach((leave) => dates.add(leave.date))
  context.circulars.forEach((circular) => dates.add(circular.publishedAt))

  return {
    departments: Array.from(departmentNames).filter(Boolean).sort(),
    semesters: Array.from(semesters).sort((first, second) => first - second),
    dates: Array.from(dates).sort().reverse(),
    statuses: ['all', 'shortage', 'pending', 'approved', 'rejected', 'overloaded', 'unmapped', 'inactive', 'unread'],
  }
}

export function getReports(filters = {}) {
  const cleanFilters = normalizeReportFilters(filters)
  const context = getReportContext()
  const attendanceShortage = getAttendanceShortageReport(context, cleanFilters)
  const pendingLeave = getPendingLeaveReport(context, cleanFilters)
  const facultyWorkload = getFacultyWorkloadReport(context, cleanFilters)
  const departmentSubjectCoverage = getDepartmentSubjectCoverageReport(context, cleanFilters)
  const inactiveMasterData = getInactiveMasterDataReport(context, cleanFilters)
  const circularEngagement = getCircularEngagementReport(context, cleanFilters)
  const dailySummary = getDailyOperationsSummary(context, cleanFilters)

  return {
    version: 1,
    source: 'sqlite',
    generatedAt: new Date().toISOString(),
    filters: cleanFilters,
    filterOptions: getReportFilterOptions(context),
    kpis: {
      attendanceShortage: attendanceShortage.length,
      pendingLeaves: pendingLeave.filter((leave) => leave.status === 'pending').length,
      overloadedFaculty: facultyWorkload.filter((teacher) => teacher.loadStatus === 'overloaded').length,
      unmappedCoverageRows: departmentSubjectCoverage.filter((row) => row.unmappedSubjects > 0).length,
      inactiveRecords: inactiveMasterData.length,
      unreadCirculars: circularEngagement.reduce((total, row) => total + row.unreadCount, 0),
      markedAttendanceToday: dailySummary.markedAttendanceCount,
    },
    attendanceShortage,
    pendingLeave,
    facultyWorkload,
    departmentSubjectCoverage,
    inactiveMasterData,
    circularEngagement,
    dailySummary,
  }
}

export function getReportByName(name, filters = {}) {
  const reports = getReports(filters)
  const reportMap = {
    'attendance-shortage': reports.attendanceShortage,
    'pending-leave': reports.pendingLeave,
    'faculty-workload': reports.facultyWorkload,
    'department-subject-coverage': reports.departmentSubjectCoverage,
    'inactive-master-data': reports.inactiveMasterData,
    'circular-engagement': reports.circularEngagement,
    'daily-summary': reports.dailySummary,
  }

  return {
    version: reports.version,
    source: reports.source,
    generatedAt: reports.generatedAt,
    filters: reports.filters,
    report: reportMap[name],
  }
}

export function createReportAuditEvent(input) {
  const actor = safeString(input?.actor) || 'CampusOps Admin'
  const action = safeString(input?.action) || 'Report action'
  const reportName = safeString(input?.reportName) || 'reports center'
  const outcome = safeString(input?.outcome) || `${reportName} action completed.`

  return createAuditEvent({
    actor,
    action,
    outcome,
    severity: input?.severity === 'warning' ? 'warning' : 'success',
  })
}

export function getDatabaseInfo() {
  return {
    path: dbPath,
    departments: db.prepare('SELECT COUNT(*) AS count FROM departments').get().count,
    subjects: db.prepare('SELECT COUNT(*) AS count FROM subjects').get().count,
    academicSections: db.prepare('SELECT COUNT(*) AS count FROM academic_class_sections').get().count,
    academicStudents: db.prepare('SELECT COUNT(*) AS count FROM academic_students').get().count,
    timetableSlots: db.prepare('SELECT COUNT(*) AS count FROM academic_timetable_slots').get().count,
    attendanceRecords: db.prepare('SELECT COUNT(*) AS count FROM academic_attendance_records').get().count,
    leaveRequests: db.prepare('SELECT COUNT(*) AS count FROM academic_leave_requests').get().count,
    staffProfiles: db.prepare('SELECT COUNT(*) AS count FROM staff_profiles').get().count,
    circulars: db.prepare('SELECT COUNT(*) AS count FROM circulars').get().count,
    circularReadReceipts: db.prepare('SELECT COUNT(*) AS count FROM circular_read_receipts').get().count,
    auditEvents: db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count,
  }
}
