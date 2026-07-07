import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { slugify } from './validation.js'

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
    auditEvents: db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count,
  }
}
