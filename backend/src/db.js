import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { masterDataStatuses, normalizeValue, slugify, subjectKinds } from './validation.js'

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

const seedAuthUsers = [
  [
    'admin-office',
    'admin',
    'Dr. Priya Menon',
    'Academic Admin',
    'admin@campus.edu',
    'admin-office',
    'Setup, imports, timetable mapping, reports, audits, and all approvals.',
    'active',
  ],
  [
    'faculty-anjali',
    'faculty',
    'Prof. Anjali Rao',
    'Faculty',
    'anjali.rao@campus.edu',
    't-anjali',
    'Daily periods, attendance register, assigned leave approvals, and class workload.',
    'active',
  ],
  [
    'student-aisha',
    'student',
    'Aisha Khan',
    'Student',
    'aisha.khan@campus.edu',
    's-aisha',
    "Today's timetable, attendance status, leave application, and request tracking.",
    'active',
  ],
]

const seedKnowledgeDocuments = [
  {
    id: 'kb-attendance-leave',
    title: 'Attendance, Leave, and Medical Exception Rules',
    source: 'Academic Handbook',
    owner: 'Academic Office',
    tags: ['attendance', 'leave', 'medical', 'faculty', 'shortage'],
    body: `# Minimum attendance
Students must maintain at least 75 percent attendance in every mapped subject to remain eligible for regular internal assessment and examination processing.

# Period-wise leave
Leave is reviewed against the exact class section, date, period, subject, and assigned faculty. Faculty can approve medical or official duty exceptions only for the period they are responsible for.

# Medical exception
Medical leave requires a reason and supporting certificate. Approved medical leave should be marked as excused rather than present. Pending medical leave may temporarily appear as pending leave in the attendance register.

# Shortage review
The academic office must review shortage reports weekly. Students below 75 percent should be flagged for advisor follow-up before the examination eligibility list is prepared.`,
  },
  {
    id: 'kb-timetable-mapping',
    title: 'Timetable Mapping and Attendance Register SOP',
    source: 'Academic Operations SOP',
    owner: 'Academic Admin',
    tags: ['timetable', 'attendance', 'class', 'room', 'teacher', 'mapping'],
    body: `# Timetable mapping
Every attendance record must be tied to a mapped timetable slot. A valid slot includes class section, day, period number, start time, end time, subject, assigned teacher, and room.

# Conflict rules
The same teacher should not be assigned to two class sections in the same day and period. The same room should not be assigned to two active sections in the same period.

# Import checks
Bulk timetable imports should be previewed before saving. Rejected rows must be corrected and re-uploaded instead of manually editing partial data.

# Attendance register
Faculty should mark attendance on the same day. Unmarked students may be marked present only after the teacher confirms the class was conducted.`,
  },
  {
    id: 'kb-circular-engagement',
    title: 'Circular Publishing and Read Receipt Policy',
    source: 'Admin Communication Policy',
    owner: 'Admin Office',
    tags: ['circular', 'notice', 'read receipt', 'department', 'communication'],
    body: `# Circular audience
Circulars must target the smallest correct audience: everyone, students, faculty, class section, or department.

# Priority use
Urgent circulars are reserved for same-day operational changes, safety notices, or deadline-critical instructions. Important circulars are used for academic schedule changes.

# Read receipts
The admin office should monitor unread counts for urgent and important circulars. Low read rates require reminder action through the department or class advisor.

# Attachments
Attachments should be named clearly so students and faculty can verify the notice context without contacting the office.`,
  },
  {
    id: 'kb-placement-faq',
    title: 'Placement Cell FAQ and Drive Notices',
    source: 'TPO Notice Board',
    owner: 'Placement Cell',
    tags: ['placement', 'eligibility', 'company', 'interview', 'resume'],
    body: `# Eligibility
Placement eligibility may include attendance, active enrollment, department, semester, arrear status, and company-specific academic criteria.

# Registration
Students must register before the published deadline. Late registrations require placement officer approval and may be rejected if the company list has already been submitted.

# Interview schedule
Interview venue, reporting time, resume format, and allowed documents must be confirmed from the latest placement circular.

# Student questions
Answers about eligibility or deadlines must cite the active drive notice or placement FAQ instead of relying on memory.`,
  },
  {
    id: 'kb-expense-policy',
    title: 'Purchase and Reimbursement Policy',
    source: 'Accounts Manual',
    owner: 'Accounts Office',
    tags: ['expense', 'invoice', 'budget', 'payment', 'accounts'],
    body: `# Reimbursement limits
Expense claims must include invoice, budget head, event or department purpose, and approver information before payment processing.

# Duplicate invoice check
Accounts staff should check vendor name, invoice number, date, and amount before approving a reimbursement.

# Approval authority
High-value expenses require HOD or principal approval. Student activity expenses require faculty sponsor confirmation before accounts processing.

# Payment controls
No payment should be marked payable unless the claim is approved and the audit trail contains the approver decision.`,
  },
]

const seedAutomationRules = [
  {
    id: 'auto-attendance-reminder',
    name: 'Missing attendance reminder',
    description: 'Notify the assigned faculty when a mapped register still has unmarked students.',
    category: 'Attendance',
    triggerType: 'attendance_gap',
    condition: { minimumSeverity: 'warning' },
    action: { type: 'in_app_notification', target: 'signal_owner' },
    approvalRequired: false,
    cooldownMinutes: 720,
  },
  {
    id: 'auto-leave-escalation',
    name: 'Pending leave escalation',
    description: 'Prepare an escalation when a period-wise leave request remains pending.',
    category: 'Leave',
    triggerType: 'pending_leave',
    condition: { minimumSeverity: 'warning' },
    action: { type: 'in_app_notification', target: 'signal_owner' },
    approvalRequired: true,
    cooldownMinutes: 1440,
  },
  {
    id: 'auto-shortage-follow-up',
    name: 'Attendance shortage follow-up',
    description: 'Notify the responsible class team when a student falls below the college threshold.',
    category: 'Attendance',
    triggerType: 'attendance_shortage',
    condition: { minimumSeverity: 'warning' },
    action: { type: 'in_app_notification', target: 'signal_owner' },
    approvalRequired: false,
    cooldownMinutes: 1440,
  },
  {
    id: 'auto-circular-reminder',
    name: 'Unread circular reminder',
    description: 'Notify the target owner when an active circular still has unread recipients.',
    category: 'Circulars',
    triggerType: 'circular_unread',
    condition: { minimumSeverity: 'warning' },
    action: { type: 'in_app_notification', target: 'signal_owner' },
    approvalRequired: false,
    cooldownMinutes: 360,
  },
  {
    id: 'auto-policy-expiry',
    name: 'Policy expiry warning',
    description: 'Warn a policy owner before an approved knowledge source expires.',
    category: 'Knowledge',
    triggerType: 'policy_expiry',
    condition: { daysBefore: 30 },
    action: { type: 'in_app_notification', target: 'signal_owner' },
    approvalRequired: false,
    cooldownMinutes: 1440,
  },
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

  CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    actor_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
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

  CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    owner TEXT NOT NULL,
    tags TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
    audience TEXT NOT NULL DEFAULT 'everyone',
    version_label TEXT NOT NULL DEFAULT '1.0',
    effective_at TEXT,
    expires_at TEXT,
    page_count INTEGER NOT NULL DEFAULT 1,
    format TEXT NOT NULL DEFAULT 'text',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES knowledge_documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    heading TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts USING fts5(
    chunk_id UNINDEXED,
    title,
    heading,
    content,
    tags,
    tokenize = 'porter unicode61'
  );

  CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    condition_json TEXT NOT NULL,
    action_json TEXT NOT NULL,
    approval_required INTEGER NOT NULL DEFAULT 0 CHECK (approval_required IN (0, 1)),
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    cooldown_minutes INTEGER NOT NULL DEFAULT 1440 CHECK (cooldown_minutes BETWEEN 1 AND 43200),
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS automation_runs (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL REFERENCES automation_rules(id) ON UPDATE CASCADE ON DELETE CASCADE,
    signal_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('completed', 'awaiting_approval', 'rejected', 'no_match', 'failed')),
    match_count INTEGER NOT NULL DEFAULT 0,
    notification_count INTEGER NOT NULL DEFAULT 0,
    attempt INTEGER NOT NULL DEFAULT 1,
    summary TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '[]',
    error_message TEXT NOT NULL DEFAULT '',
    started_by TEXT NOT NULL,
    decided_by TEXT,
    decided_at TEXT,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS automation_runs_rule_started_idx
    ON automation_runs (rule_id, started_at DESC);

  CREATE TABLE IF NOT EXISTS automation_notifications (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES automation_runs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'failed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT,
    read_at TEXT
  );

  CREATE INDEX IF NOT EXISTS automation_notifications_status_idx
    ON automation_notifications (status, created_at DESC);

  CREATE TABLE IF NOT EXISTS institution_profile (
    id TEXT PRIMARY KEY CHECK (id = 'primary'),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    code TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    current_term TEXT NOT NULL,
    timezone TEXT NOT NULL,
    attendance_threshold INTEGER NOT NULL CHECK (attendance_threshold BETWEEN 1 AND 100),
    email_domain TEXT NOT NULL,
    website TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

function ensureKnowledgeDocumentColumn(name, definition) {
  const columns = db.prepare('PRAGMA table_info(knowledge_documents)').all()
  if (!columns.some((column) => column.name === name)) {
    db.exec(`ALTER TABLE knowledge_documents ADD COLUMN ${name} ${definition}`)
  }
}

ensureKnowledgeDocumentColumn('audience', "TEXT NOT NULL DEFAULT 'everyone'")
ensureKnowledgeDocumentColumn('version_label', "TEXT NOT NULL DEFAULT '1.0'")
ensureKnowledgeDocumentColumn('effective_at', 'TEXT')
ensureKnowledgeDocumentColumn('expires_at', 'TEXT')
ensureKnowledgeDocumentColumn('page_count', 'INTEGER NOT NULL DEFAULT 1')
ensureKnowledgeDocumentColumn('format', "TEXT NOT NULL DEFAULT 'text'")

db.prepare(`
  INSERT OR IGNORE INTO institution_profile (
    id,
    name,
    short_name,
    code,
    academic_year,
    current_term,
    timezone,
    attendance_threshold,
    email_domain,
    website
  )
  VALUES ('primary', ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'CampusOps Demonstration College',
  'CampusOps College',
  'COC',
  '2026-27',
  'Odd Semester',
  'Asia/Kolkata',
  75,
  'campus.edu',
  'https://campus.edu',
)

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

const insertAuthUserStatement = db.prepare(`
  INSERT INTO auth_users (id, role, name, title, email, actor_id, summary, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertKnowledgeDocumentStatement = db.prepare(`
  INSERT INTO knowledge_documents (
    id, title, source, owner, tags, status, audience, version_label,
    effective_at, expires_at, page_count, format
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertKnowledgeChunkStatement = db.prepare(`
  INSERT INTO knowledge_chunks (id, document_id, chunk_index, heading, page_number, content, tags, token_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertKnowledgeFtsStatement = db.prepare(`
  INSERT INTO knowledge_chunks_fts (chunk_id, title, heading, content, tags)
  VALUES (?, ?, ?, ?, ?)
`)

const insertAutomationRuleStatement = db.prepare(`
  INSERT INTO automation_rules (
    id, name, description, category, trigger_type, condition_json, action_json,
    approval_required, enabled, cooldown_minutes, created_by
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

function insertAutomationRule(rule, actor = 'CampusOps System') {
  insertAutomationRuleStatement.run(
    rule.id,
    rule.name,
    rule.description,
    rule.category,
    rule.triggerType,
    JSON.stringify(rule.condition ?? {}),
    JSON.stringify(rule.action ?? {}),
    rule.approvalRequired ? 1 : 0,
    rule.enabled === false ? 0 : 1,
    Number(rule.cooldownMinutes) || 1440,
    actor,
  )
}

function normalizeKnowledgeTags(tags) {
  const source = Array.isArray(tags) ? tags : String(tags ?? '').split(',')
  return [...new Set(source.map((tag) => safeString(tag).toLowerCase()).filter(Boolean))].slice(0, 12)
}

function knowledgeTokenCount(value) {
  return safeString(value).split(/\s+/).filter(Boolean).length
}

function chunkKnowledgeSection(text, heading, pageNumber) {
  const content = safeString(text).replace(/\s+/g, ' ').trim()
  if (!content) {
    return []
  }

  const words = content.split(/\s+/)
  if (words.length < 8) {
    return []
  }
  const chunks = []
  for (let index = 0; index < words.length; index += 120) {
    chunks.push({
      heading,
      content: words.slice(index, index + 150).join(' '),
      pageNumber,
    })
  }
  return chunks
}

function chunkKnowledgePage(page, fallbackIndex) {
  const pageNumber = Number.isInteger(Number(page?.pageNumber)) && Number(page.pageNumber) > 0
    ? Number(page.pageNumber)
    : fallbackIndex + 1
  const rawText = safeString(page?.text ?? page?.content)
  if (!rawText) {
    return []
  }

  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const suppliedHeading = safeString(page?.heading)
  const sections = []
  let current = { heading: suppliedHeading || `Page ${pageNumber}`, lines: [] }

  const pushCurrent = () => {
    if (current.lines.length > 0) {
      sections.push(current)
    }
  }

  lines.forEach((line) => {
    const markedHeading = line.match(/^#{1,3}\s+(.+)$/)
    const wordCount = line.split(/\s+/).length
    const likelyFooter = wordCount <= 12 && /page\s+\d+(?:\s+of\s+\d+)?$/i.test(line)
    if (likelyFooter) {
      return
    }
    const inferredHeading = !/[.!?;:]$/.test(line) && line.length <= 80 && wordCount <= 10
    if (markedHeading || inferredHeading) {
      pushCurrent()
      current = { heading: markedHeading?.[1]?.trim() || line, lines: [] }
      return
    }
    current.lines.push(line)
  })
  pushCurrent()

  return sections.flatMap((section) => chunkKnowledgeSection(
    section.lines.join(' '),
    section.heading || `Page ${pageNumber}`,
    pageNumber,
  ))
}

function knowledgePagesFromInput(input) {
  const suppliedPages = Array.isArray(input?.pages)
    ? input.pages.filter((page) => safeString(page?.text ?? page?.content))
    : []
  if (suppliedPages.length > 0) {
    return suppliedPages
  }

  const rawBody = safeString(input?.body)
  if (!rawBody) {
    return []
  }
  return rawBody.split(/\f/g).map((text, index) => ({ pageNumber: index + 1, text }))
}

function chunkKnowledgeInput(input) {
  return knowledgePagesFromInput(input).flatMap(chunkKnowledgePage)
}

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

  const authUserCount = db.prepare('SELECT COUNT(*) AS count FROM auth_users').get().count
  if (authUserCount === 0) {
    seedAuthUsers.forEach((user) => insertAuthUserStatement.run(...user))
  }

  const knowledgeDocumentCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_documents').get().count
  if (knowledgeDocumentCount === 0) {
    seedKnowledgeDocuments.forEach((document) => insertKnowledgeDocument(document))
  }

  const automationRuleCount = db.prepare('SELECT COUNT(*) AS count FROM automation_rules').get().count
  if (automationRuleCount === 0) {
    seedAutomationRules.forEach((rule) => insertAutomationRule(rule))
  }
}

seedIfNeeded()

function rebuildKnowledgeFtsIndex() {
  db.exec('DELETE FROM knowledge_chunks_fts')
  db.exec(`
    INSERT INTO knowledge_chunks_fts (chunk_id, title, heading, content, tags)
    SELECT c.id, d.title, c.heading, c.content, c.tags
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON d.id = c.document_id
  `)
}

db.prepare("UPDATE knowledge_documents SET audience = 'faculty' WHERE id = 'kb-timetable-mapping' AND audience = 'everyone'").run()
db.prepare("UPDATE knowledge_documents SET audience = 'students' WHERE id = 'kb-placement-faq' AND audience = 'everyone'").run()
db.prepare("UPDATE knowledge_documents SET audience = 'admin' WHERE id = 'kb-expense-policy' AND audience = 'everyone'").run()
db.exec(`
  UPDATE knowledge_documents
  SET page_count = MAX(
    page_count,
    COALESCE(
      (SELECT MAX(page_number) FROM knowledge_chunks WHERE document_id = knowledge_documents.id),
      1
    )
  )
`)
rebuildKnowledgeFtsIndex()

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

function rowToKnowledgeDocument(row) {
  const today = currentDateString()
  const lifecycle = row.status === 'archived'
    ? 'archived'
    : row.effectiveAt && row.effectiveAt > today
      ? 'scheduled'
      : row.expiresAt && row.expiresAt < today
        ? 'expired'
        : 'current'
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    owner: row.owner,
    tags: JSON.parse(row.tags || '[]'),
    status: row.status,
    audience: row.audience ?? 'everyone',
    versionLabel: row.versionLabel ?? '1.0',
    effectiveAt: row.effectiveAt ?? '',
    expiresAt: row.expiresAt ?? '',
    pageCount: row.pageCount ?? 1,
    format: row.format ?? 'text',
    lifecycle,
    chunkCount: row.chunkCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function insertKnowledgeDocument(input) {
  const tags = normalizeKnowledgeTags(input.tags)
  const id = safeString(input.id) || makeReadableId('kb', input.title)
  const title = safeString(input.title).replace(/\s+/g, ' ')
  const source = safeString(input.source) || 'Uploaded document'
  const owner = safeString(input.owner) || 'Admin Office'
  const pages = knowledgePagesFromInput(input)
  const chunks = chunkKnowledgeInput(input)
  const audience = ['everyone', 'students', 'faculty', 'admin'].includes(input?.audience)
    ? input.audience
    : 'everyone'
  const versionLabel = safeString(input?.versionLabel) || '1.0'
  const effectiveAt = nullableString(input?.effectiveAt)
  const expiresAt = nullableString(input?.expiresAt)
  const format = input?.format === 'pdf' || safeString(source).toLowerCase().endsWith('.pdf') ? 'pdf' : 'text'
  const pageCount = Math.max(
    Number(input?.pageCount) || 1,
    ...pages.map((page, index) => Number(page?.pageNumber) || index + 1),
  )

  if (title.length < 3) {
    throw new Error('Knowledge document title is required.')
  }
  if (chunks.length === 0) {
    throw new Error('Knowledge document body must include searchable text.')
  }
  if (effectiveAt && expiresAt && effectiveAt > expiresAt) {
    throw new Error('Policy expiry date must be after its effective date.')
  }

  insertKnowledgeDocumentStatement.run(
    id,
    title,
    source,
    owner,
    JSON.stringify(tags),
    'active',
    audience,
    versionLabel,
    effectiveAt,
    expiresAt,
    pageCount,
    format,
  )
  chunks.forEach((chunk, index) => {
    insertKnowledgeChunkStatement.run(
      `${id}-chunk-${index + 1}`,
      id,
      index + 1,
      chunk.heading,
      chunk.pageNumber,
      chunk.content,
      JSON.stringify(tags),
      knowledgeTokenCount(chunk.content),
    )
    insertKnowledgeFtsStatement.run(
      `${id}-chunk-${index + 1}`,
      title,
      chunk.heading,
      chunk.content,
      tags.join(' '),
    )
  })

  return id
}

function knowledgeAudiencesForUser(user) {
  if (user?.role === 'admin') {
    return ['everyone', 'students', 'faculty', 'admin']
  }
  if (user?.role === 'faculty') {
    return ['everyone', 'faculty']
  }
  return ['everyone', 'students']
}

export function getKnowledgeDocuments(user = { role: 'admin' }) {
  const audiences = knowledgeAudiencesForUser(user)
  const placeholders = audiences.map(() => '?').join(', ')
  return db
    .prepare(`
      SELECT
        d.id,
        d.title,
        d.source,
        d.owner,
        d.tags,
        d.status,
        d.audience,
        d.version_label AS versionLabel,
        d.effective_at AS effectiveAt,
        d.expires_at AS expiresAt,
        d.page_count AS pageCount,
        d.format,
        d.created_at AS createdAt,
        d.updated_at AS updatedAt,
        COUNT(c.id) AS chunkCount
      FROM knowledge_documents d
      LEFT JOIN knowledge_chunks c ON c.document_id = d.id
      WHERE d.audience IN (${placeholders})
      GROUP BY d.id
      ORDER BY d.updated_at DESC, d.title
    `)
    .all(...audiences)
    .map(rowToKnowledgeDocument)
}

export function getKnowledgeState(user = { role: 'admin' }) {
  const documents = getKnowledgeDocuments(user)
  return {
    version: 2,
    source: 'sqlite',
    documents,
    stats: {
      documents: documents.length,
      activeDocuments: documents.filter((document) => document.lifecycle === 'current').length,
      chunks: documents
        .filter((document) => document.lifecycle === 'current')
        .reduce((total, document) => total + document.chunkCount, 0),
      restrictedDocuments: documents.filter((document) => document.audience !== 'everyone').length,
      pdfDocuments: documents.filter((document) => document.format === 'pdf').length,
    },
  }
}

export function createKnowledgeDocument(input, actor = 'CampusOps Admin') {
  let documentId = ''
  db.exec('BEGIN')
  try {
    documentId = insertKnowledgeDocument(input)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  const document = getKnowledgeDocuments().find((item) => item.id === documentId)
  const auditEvent = createAuditEvent({
    actor,
    action: 'Added knowledge document',
    outcome: `${document?.title ?? 'Knowledge document'} added to RAG search.`,
    severity: 'success',
  })

  return {
    document,
    auditEvent,
    state: getKnowledgeState(),
  }
}

export function resetKnowledgeData(actor = 'CampusOps Admin') {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM knowledge_chunks_fts')
    db.exec('DELETE FROM knowledge_chunks')
    db.exec('DELETE FROM knowledge_documents')
    seedKnowledgeDocuments.forEach((document) => insertKnowledgeDocument(document))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  const auditEvent = createAuditEvent({
    actor,
    action: 'Reset knowledge base',
    outcome: 'Policy knowledge documents were reset to demo defaults.',
    severity: 'warning',
  })

  return {
    ...getKnowledgeState(),
    auditEvent,
  }
}

const knowledgeStopWords = new Set([
  'and', 'are', 'can', 'does', 'for', 'from', 'how', 'the', 'this', 'what', 'when', 'where', 'which', 'who', 'with',
])

const knowledgeConcepts = {
  attendance: ['attendance', 'presence', 'present', 'absence', 'absent', 'shortage'],
  leave: ['leave', 'medical', 'permission', 'excused', 'absence'],
  approval: ['approval', 'approve', 'approves', 'approved', 'authority', 'authorise', 'authorize', 'reviewer'],
  timetable: ['timetable', 'schedule', 'period', 'slot', 'class', 'room', 'teacher'],
  circular: ['circular', 'notice', 'announcement', 'communication', 'receipt', 'unread'],
  placement: ['placement', 'company', 'drive', 'interview', 'recruitment', 'eligibility'],
  expense: ['expense', 'reimbursement', 'invoice', 'payment', 'purchase', 'budget'],
  deadline: ['deadline', 'expiry', 'expires', 'due', 'lastdate', 'closing'],
}

function tokenizeKnowledgeQuery(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !knowledgeStopWords.has(token))
    .slice(0, 16)
}

function expandKnowledgeTokens(tokens) {
  const expanded = new Set(tokens)
  Object.entries(knowledgeConcepts).forEach(([concept, terms]) => {
    if (terms.some((term) => tokens.includes(term))) {
      expanded.add(concept)
      terms.forEach((term) => expanded.add(term))
    }
  })
  return [...expanded].slice(0, 32)
}

function matchedKnowledgeConcepts(tokens) {
  return Object.entries(knowledgeConcepts)
    .filter(([, terms]) => terms.some((term) => tokens.includes(term)))
    .map(([concept]) => concept)
}

function scoreKnowledgeChunk(row, tokens, expandedTokens, ftsRankScore) {
  const haystack = `${row.title} ${row.heading} ${row.content} ${row.tags}`.toLowerCase()
  const title = String(row.title ?? '').toLowerCase()
  const heading = String(row.heading ?? '').toLowerCase()
  const exactScore = tokens.reduce((score, token) => {
    if (!haystack.includes(token)) {
      return score
    }
    const titleBoost = title.includes(token) ? 8 : 0
    const headingBoost = heading.includes(token) ? 5 : 0
    const frequency = haystack.split(token).length - 1
    return score + 4 + titleBoost + headingBoost + Math.min(frequency, 5)
  }, 0)
  const semanticScore = expandedTokens
    .filter((token) => !tokens.includes(token) && haystack.includes(token))
    .reduce((score, token) => score + (heading.includes(token) ? 3 : title.includes(token) ? 4 : 1), 0)
  const conceptScore = matchedKnowledgeConcepts(tokens).reduce((score, concept) => {
    if (title.includes(concept)) return score + 20
    if (heading.includes(concept)) return score + 14
    if (haystack.includes(concept)) return score + 4
    return score
  }, 0)
  const relevanceScore = exactScore + Math.min(semanticScore, 16) + conceptScore + ftsRankScore
  const authorityBoost = relevanceScore > 0 && /handbook|policy|manual|standard operating|sop/i.test(`${row.source} ${row.title}`) ? 4 : 0
  return relevanceScore + authorityBoost
}

function makeKnowledgeSnippet(content, tokens) {
  const text = safeString(content).replace(/\s+/g, ' ')
  const lower = text.toLowerCase()
  const firstHit = tokens
    .map((token) => lower.indexOf(token))
    .filter((index) => index >= 0)
    .sort((first, second) => first - second)[0]
  const start = firstHit >= 0 ? Math.max(firstHit - 70, 0) : 0
  const snippet = text.slice(start, start + 240)
  return `${start > 0 ? '...' : ''}${snippet}${start + 240 < text.length ? '...' : ''}`
}

function visibleKnowledgeRows(user) {
  const audiences = knowledgeAudiencesForUser(user)
  const placeholders = audiences.map(() => '?').join(', ')
  const today = currentDateString()
  return db.prepare(`
    SELECT
      c.id,
      c.document_id AS documentId,
      c.chunk_index AS chunkIndex,
      c.heading,
      c.page_number AS pageNumber,
      c.content,
      c.tags,
      d.title,
      d.source,
      d.owner,
      d.audience,
      d.version_label AS versionLabel,
      d.effective_at AS effectiveAt,
      d.expires_at AS expiresAt,
      d.format
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON d.id = c.document_id
    WHERE d.status = 'active'
      AND d.audience IN (${placeholders})
      AND (d.effective_at IS NULL OR d.effective_at = '' OR d.effective_at <= ?)
      AND (d.expires_at IS NULL OR d.expires_at = '' OR d.expires_at >= ?)
    ORDER BY d.updated_at DESC, c.chunk_index
  `).all(...audiences, today, today)
}

function knowledgeFtsRank(tokens, user) {
  if (tokens.length === 0) {
    return new Map()
  }
  const audiences = knowledgeAudiencesForUser(user)
  const placeholders = audiences.map(() => '?').join(', ')
  const today = currentDateString()
  const ftsQuery = tokens.map((token) => `"${token.replace(/"/g, '')}"`).join(' OR ')
  try {
    const matches = db.prepare(`
      SELECT f.chunk_id AS chunkId
      FROM knowledge_chunks_fts f
      JOIN knowledge_chunks c ON c.id = f.chunk_id
      JOIN knowledge_documents d ON d.id = c.document_id
      WHERE knowledge_chunks_fts MATCH ?
        AND d.status = 'active'
        AND d.audience IN (${placeholders})
        AND (d.effective_at IS NULL OR d.effective_at = '' OR d.effective_at <= ?)
        AND (d.expires_at IS NULL OR d.expires_at = '' OR d.expires_at >= ?)
      ORDER BY bm25(knowledge_chunks_fts, 0.0, 8.0, 6.0, 2.0, 3.0)
      LIMIT 30
    `).all(ftsQuery, ...audiences, today, today)
    return new Map(matches.map((match, index) => [match.chunkId, Math.max(8, 40 - index * 2)]))
  } catch {
    return new Map()
  }
}

function relevantKnowledgeSentences(content, tokens) {
  const sentences = safeString(content).split(/(?<=[.!?])\s+/).filter(Boolean)
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: tokens.reduce((score, token) => score + (sentence.toLowerCase().includes(token) ? 1 : 0), 0),
    }))
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .slice(0, 2)
    .sort((first, second) => first.index - second.index)
  return ranked.map((item) => item.sentence).join(' ')
}

function knowledgeMatchReasons(row, tokens, expandedTokens, ftsRankScore) {
  const reasons = []
  const title = String(row.title).toLowerCase()
  const heading = String(row.heading).toLowerCase()
  if (tokens.some((token) => title.includes(token))) reasons.push('title match')
  if (tokens.some((token) => heading.includes(token))) reasons.push('section match')
  if (expandedTokens.some((token) => !tokens.includes(token) && `${title} ${heading} ${row.content}`.toLowerCase().includes(token))) {
    reasons.push('related policy concept')
  }
  if (ftsRankScore > 0) reasons.push('FTS5 ranked match')
  return reasons.length > 0 ? reasons : ['content match']
}

export function searchKnowledgeBase(input = {}, user = { role: 'admin', name: 'CampusOps' }, options = {}) {
  const query = safeString(input.query)
  const tokens = tokenizeKnowledgeQuery(query)
  const expandedTokens = expandKnowledgeTokens(tokens)
  const actor = safeString(user?.name) || 'CampusOps'

  if (tokens.length === 0) {
    return {
      version: 2,
      query,
      answer: 'Ask a question with at least one searchable policy term.',
      citations: [],
      confidence: 0,
      grounded: false,
      retrievalMode: 'sqlite-fts5+concepts',
      warnings: ['The question did not contain a searchable policy term.'],
    }
  }

  const rows = visibleKnowledgeRows(user)
  const ftsRanks = knowledgeFtsRank(expandedTokens, user)

  const citations = rows
    .map((row) => {
      const ftsRankScore = ftsRanks.get(row.id) ?? 0
      return {
        id: row.id,
        documentId: row.documentId,
        title: row.title,
        source: row.source,
        owner: row.owner,
        heading: row.heading,
        pageNumber: row.pageNumber,
        content: row.content,
        snippet: makeKnowledgeSnippet(row.content, expandedTokens),
        tags: JSON.parse(row.tags || '[]'),
        score: scoreKnowledgeChunk(row, tokens, expandedTokens, ftsRankScore),
        audience: row.audience,
        versionLabel: row.versionLabel,
        effectiveAt: row.effectiveAt ?? '',
        expiresAt: row.expiresAt ?? '',
        format: row.format,
        matchReasons: knowledgeMatchReasons(row, tokens, expandedTokens, ftsRankScore),
      }
    })
    .filter((row) => row.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 5)

  if (citations.length === 0) {
    if (options.audit !== false) {
      createAuditEvent({
        actor,
        action: 'Searched knowledge base',
        outcome: `No policy citations found for "${query}".`,
        severity: 'warning',
      })
    }
    return {
      version: 2,
      query,
      answer: 'I cannot answer this from the policies visible to your role. Try a more specific question or ask the policy owner to add the approved source.',
      citations: [],
      confidence: 0,
      grounded: false,
      retrievalMode: 'sqlite-fts5+concepts',
      warnings: ['No current, role-visible policy evidence matched this question.'],
    }
  }

  const confidence = Math.min(96, Math.round(35 + Math.min(citations[0].score, 70) * 0.68 + Math.min(citations.length, 3) * 3))
  const answer = citations
    .slice(0, 2)
    .map((citation) => `According to ${citation.title} (${citation.heading}, page ${citation.pageNumber}), ${relevantKnowledgeSentences(citation.content, expandedTokens)}`)
    .join('\n\n')
  const warnings = confidence < 65
    ? ['Evidence is limited. Review the cited policy text before taking action.']
    : []

  if (options.audit !== false) {
    createAuditEvent({
      actor,
      action: 'Searched knowledge base',
      outcome: `${citations.length} role-visible policy citations found for "${query}".`,
      severity: 'info',
    })
  }

  return {
    version: 2,
    query,
    answer,
    citations,
    confidence,
    grounded: true,
    retrievalMode: 'sqlite-fts5+concepts',
    warnings,
  }
}

const knowledgeEvaluationCases = [
  { id: 'attendance', question: 'What minimum presence must students maintain in every subject?', expectedDocumentId: 'kb-attendance-leave', expectedTerm: '75 percent' },
  { id: 'medical-leave', question: 'Who can approve medical leave for a period?', expectedDocumentId: 'kb-attendance-leave', expectedTerm: 'faculty' },
  { id: 'timetable', question: 'Can one teacher be scheduled for two classes in the same period?', expectedDocumentId: 'kb-timetable-mapping', expectedTerm: 'same teacher' },
  { id: 'circular', question: 'What should happen when urgent notices remain unread?', expectedDocumentId: 'kb-circular-engagement', expectedTerm: 'reminder' },
  { id: 'placement', question: 'Can students register after the placement deadline?', expectedDocumentId: 'kb-placement-faq', expectedTerm: 'late registrations' },
  { id: 'expense', question: 'Who approves a high value reimbursement?', expectedDocumentId: 'kb-expense-policy', expectedTerm: 'principal' },
]

export function runKnowledgeEvaluation(user = { role: 'admin', name: 'CampusOps Evaluator' }) {
  const startedAt = Date.now()
  const cases = knowledgeEvaluationCases.map((testCase) => {
    const result = searchKnowledgeBase({ query: testCase.question }, user, { audit: false })
    const citationCorrect = result.citations[0]?.documentId === testCase.expectedDocumentId
    const answerSupported = result.answer.toLowerCase().includes(testCase.expectedTerm.toLowerCase())
    return {
      ...testCase,
      citationCorrect,
      answerSupported,
      passed: citationCorrect && answerSupported,
      confidence: result.confidence,
      retrievedDocument: result.citations[0]?.title ?? 'No citation',
    }
  })
  const passed = cases.filter((testCase) => testCase.passed).length
  const citationPassed = cases.filter((testCase) => testCase.citationCorrect).length
  const answerPassed = cases.filter((testCase) => testCase.answerSupported).length
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    retrievalMode: 'sqlite-fts5+concepts',
    total: cases.length,
    passed,
    accuracy: Math.round((passed / cases.length) * 100),
    citationAccuracy: Math.round((citationPassed / cases.length) * 100),
    answerSupport: Math.round((answerPassed / cases.length) * 100),
    durationMs: Date.now() - startedAt,
    cases,
  }
}

function rowToAuthUser(row) {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    title: row.title,
    email: row.email,
    actorId: row.actorId,
    summary: row.summary,
    status: row.status,
  }
}

export function getAuthUsers() {
  return db
    .prepare(`
      SELECT
        id,
        role,
        name,
        title,
        email,
        actor_id AS actorId,
        summary,
        status
      FROM auth_users
      WHERE status = 'active'
      ORDER BY
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'faculty' THEN 2
          ELSE 3
        END,
        name
    `)
    .all()
    .map(rowToAuthUser)
}

export function getAuthUserById(id) {
  const row = db
    .prepare(`
      SELECT
        id,
        role,
        name,
        title,
        email,
        actor_id AS actorId,
        summary,
        status
      FROM auth_users
      WHERE id = ?
    `)
    .get(String(id ?? ''))

  return row ? rowToAuthUser(row) : null
}

export function createAuthSession(input) {
  const accountId = String(input?.accountId ?? input?.id ?? '').trim()
  const user = getAuthUserById(accountId)

  if (!user || user.status !== 'active') {
    throw new Error('Active user account was not found.')
  }

  const token = `cos_${randomUUID()}`
  const timestamp = new Date().toISOString()
  db.prepare(`
    INSERT INTO auth_sessions (token, user_id, created_at, last_seen_at)
    VALUES (?, ?, ?, ?)
  `).run(token, user.id, timestamp, timestamp)

  createAuditEvent({
    actor: user.name,
    action: 'Started session',
    outcome: `${user.title} workspace opened with backend RBAC session.`,
    severity: 'success',
  })

  return {
    token,
    user,
  }
}

export function getAuthSession(token) {
  const cleanToken = String(token ?? '').trim()
  if (!cleanToken) {
    return null
  }

  const row = db
    .prepare(`
      SELECT
        s.token,
        u.id,
        u.role,
        u.name,
        u.title,
        u.email,
        u.actor_id AS actorId,
        u.summary,
        u.status
      FROM auth_sessions s
      JOIN auth_users u ON u.id = s.user_id
      WHERE s.token = ?
    `)
    .get(cleanToken)

  if (!row || row.status !== 'active') {
    return null
  }

  db.prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE token = ?').run(new Date().toISOString(), cleanToken)

  return {
    token: row.token,
    user: rowToAuthUser(row),
  }
}

export function deleteAuthSession(token) {
  const result = db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(String(token ?? '').trim())
  return {
    removed: result.changes > 0,
  }
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

const importKinds = new Set(['students', 'staff', 'subjects', 'timetable'])
const academicDays = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])

function importKey(value) {
  return normalizeValue(value).replace(/[^a-z0-9]/g, '')
}

function makeImportId(prefix, value) {
  return `${prefix}-${slugify(value) || randomUUID().slice(0, 8)}`
}

function readImportField(row, aliases) {
  const fields = new Map(
    Object.entries(row ?? {}).map(([key, value]) => [importKey(key), value]),
  )
  const aliasKeys = aliases.map(importKey)
  const foundAlias = aliasKeys.find((alias) => fields.has(alias))
  return foundAlias ? safeString(fields.get(foundAlias)) : ''
}

function parseImportInteger(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

function isImportEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeImportStatus(value, allowed, fallback) {
  const normalized = normalizeValue(value).replace(/[\s-]+/g, '_')
  return allowed.has(normalized) ? normalized : fallback
}

function makeImportContext() {
  const academic = getAcademicState()
  const departments = getDepartments()
  const masterSubjects = getSubjects()
  const staffProfiles = getStaffProfiles()

  const classByKey = new Map()
  academic.classSections.forEach((section) => {
    ;[section.id, section.name].forEach((key) => classByKey.set(importKey(key), section))
  })

  const teacherByKey = new Map()
  academic.teachers.forEach((teacher) => {
    ;[teacher.id, teacher.email, teacher.name].forEach((key) => teacherByKey.set(importKey(key), teacher))
  })

  const academicSubjectByKey = new Map()
  academic.subjects.forEach((subject) => {
    ;[subject.id, subject.code, subject.name].forEach((key) => academicSubjectByKey.set(importKey(key), subject))
  })

  const departmentByKey = new Map()
  departments.forEach((department) => {
    ;[department.id, department.code, department.name].forEach((key) => departmentByKey.set(importKey(key), department))
  })

  const masterSubjectByCode = new Map(masterSubjects.map((subject) => [importKey(subject.code), subject]))
  const studentByRoll = new Map(academic.students.map((student) => [importKey(student.rollNo), student]))
  const staffByEmployeeCode = new Map(staffProfiles.map((staff) => [importKey(staff.employeeCode), staff]))
  const staffByEmail = new Map(staffProfiles.map((staff) => [importKey(staff.email), staff]))
  const academicSubjectByCode = new Map(academic.subjects.map((subject) => [importKey(subject.code), subject]))
  const timetableById = new Map(academic.slots.map((slot) => [slot.id, slot]))
  const timetableByNaturalKey = new Map(
    academic.slots.map((slot) => [
      `${importKey(slot.classSectionId)}|${importKey(slot.day)}|${slot.periodNumber}`,
      slot,
    ]),
  )
  const classById = new Map(academic.classSections.map((section) => [section.id, section]))
  const teacherById = new Map(academic.teachers.map((teacher) => [teacher.id, teacher]))

  return {
    academic,
    departments,
    masterSubjects,
    classByKey,
    teacherByKey,
    academicSubjectByKey,
    departmentByKey,
    masterSubjectByCode,
    studentByRoll,
    staffByEmployeeCode,
    staffByEmail,
    academicSubjectByCode,
    timetableById,
    timetableByNaturalKey,
    classById,
    teacherById,
  }
}

function validateImportStudent(row, rowNumber, context) {
  const rollNo = readImportField(row, ['rollNo', 'roll no', 'roll number', 'student roll']).toUpperCase()
  const name = readImportField(row, ['name', 'student name']).replace(/\s+/g, ' ')
  const classValue = readImportField(row, ['classSection', 'class section', 'class', 'section'])
  const email = readImportField(row, ['email', 'student email']).toLowerCase()
  const classSection = context.classByKey.get(importKey(classValue))
  const errors = []

  if (rollNo.length < 2) {
    errors.push('Roll No is required.')
  }
  if (name.length < 3) {
    errors.push('Student name must be at least 3 characters.')
  }
  if (!classSection) {
    errors.push('Class Section must match an existing class section id or name.')
  }
  if (!isImportEmail(email)) {
    errors.push('Valid student email is required.')
  }

  const existing = context.studentByRoll.get(importKey(rollNo))
  return {
    rowNumber,
    data: row,
    errors,
    action: existing ? 'update' : 'create',
    normalized: {
      id: existing?.id ?? makeImportId('s', rollNo || name),
      rollNo,
      name,
      classSectionId: classSection?.id ?? '',
      email,
    },
  }
}

function validateImportStaff(row, rowNumber, context) {
  const employeeCode = readImportField(row, ['employeeCode', 'employee code', 'emp code']).toUpperCase()
  const name = readImportField(row, ['name', 'staff name', 'faculty name']).replace(/\s+/g, ' ')
  const department = readImportField(row, ['department', 'dept']).replace(/\s+/g, ' ')
  const designation = readImportField(row, ['designation', 'title']).replace(/\s+/g, ' ')
  const email = readImportField(row, ['email', 'faculty email', 'staff email']).toLowerCase()
  const phone = readImportField(row, ['phone', 'mobile'])
  const status = normalizeImportStatus(
    readImportField(row, ['status']),
    new Set(['active', 'on_leave', 'inactive']),
    'active',
  )
  const joinedAt = readImportField(row, ['joinedAt', 'joined at', 'joined', 'joining date']) || currentDateString()
  const officeRoom = readImportField(row, ['officeRoom', 'office room', 'room']).replace(/\s+/g, ' ')
  const teacherInput = readImportField(row, ['teacherId', 'teacher id'])
  const existing = context.staffByEmployeeCode.get(importKey(employeeCode)) ?? context.staffByEmail.get(importKey(email))
  const existingTeacher = context.teacherByKey.get(importKey(teacherInput || email || name))
  const errors = []

  if (employeeCode.length < 3) {
    errors.push('Employee Code is required.')
  }
  if (name.length < 3) {
    errors.push('Staff name must be at least 3 characters.')
  }
  if (department.length < 2) {
    errors.push('Department is required.')
  }
  if (designation.length < 2) {
    errors.push('Designation is required.')
  }
  if (!isImportEmail(email)) {
    errors.push('Valid staff email is required.')
  }
  if (phone.length < 5) {
    errors.push('Phone is required.')
  }
  if (officeRoom.length < 2) {
    errors.push('Office Room is required.')
  }

  return {
    rowNumber,
    data: row,
    errors,
    action: existing ? 'update' : 'create',
    normalized: {
      id: existing?.id ?? makeImportId('staff', employeeCode || name),
      teacherId: (existingTeacher?.id ?? existing?.teacherId ?? teacherInput) || `t-${slugify(email || employeeCode || name)}`,
      employeeCode,
      name,
      department,
      designation,
      email,
      phone,
      status,
      joinedAt,
      officeRoom,
    },
  }
}

function validateImportSubject(row, rowNumber, context) {
  const departmentValue = readImportField(row, ['department', 'department code', 'department id', 'dept'])
  const department = context.departmentByKey.get(importKey(departmentValue))
  const semester = parseImportInteger(readImportField(row, ['semester', 'sem']))
  const code = readImportField(row, ['code', 'subject code']).toUpperCase().replace(/\s+/g, '')
  const name = readImportField(row, ['name', 'subject name']).replace(/\s+/g, ' ')
  const credits = parseImportInteger(readImportField(row, ['credits', 'credit']))
  const kind = normalizeImportStatus(readImportField(row, ['kind', 'type']), subjectKinds, 'theory')
  const defaultFaculty = readImportField(row, ['defaultFaculty', 'default faculty', 'faculty']).replace(/\s+/g, ' ')
  const status = normalizeImportStatus(readImportField(row, ['status']), masterDataStatuses, 'active')
  const existing = context.masterSubjectByCode.get(importKey(code))
  const errors = []

  if (!department) {
    errors.push('Department must match an existing department id, code, or name.')
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    errors.push('Semester must be a whole number from 1 to 8.')
  }
  if (!/^[a-z0-9]{2,12}$/i.test(code)) {
    errors.push('Subject Code must be 2 to 12 letters or numbers.')
  }
  if (name.length < 3) {
    errors.push('Subject name must be at least 3 characters.')
  }
  if (!Number.isInteger(credits) || credits < 0 || credits > 6) {
    errors.push('Credits must be a whole number from 0 to 6.')
  }
  if (defaultFaculty.length < 3) {
    errors.push('Default Faculty is required.')
  }

  return {
    rowNumber,
    data: row,
    errors,
    action: existing ? 'update' : 'create',
    normalized: {
      id: existing?.id ?? makeImportId('ms', code || name),
      academicSubjectId: context.academicSubjectByCode.get(importKey(code))?.id ?? `sub-${slugify(code || name)}`,
      departmentId: department?.id ?? '',
      departmentName: department?.name ?? '',
      semester,
      code,
      name,
      credits,
      kind,
      defaultFaculty,
      status,
    },
  }
}

function validateImportTimetable(row, rowNumber, context) {
  const classValue = readImportField(row, ['classSection', 'class section', 'class', 'section'])
  const classSection = context.classByKey.get(importKey(classValue))
  const dayValue = readImportField(row, ['day'])
  const day = Array.from(academicDays).find((item) => importKey(item) === importKey(dayValue)) ?? dayValue
  const periodNumber = parseImportInteger(readImportField(row, ['periodNumber', 'period number', 'period']))
  const startTime = readImportField(row, ['startTime', 'start time'])
  const endTime = readImportField(row, ['endTime', 'end time'])
  const subjectValue = readImportField(row, ['subjectCode', 'subject code', 'subject'])
  const teacherValue = readImportField(row, ['teacher', 'teacherId', 'teacher id', 'teacher email', 'faculty'])
  const room = readImportField(row, ['room', 'classroom']).replace(/\s+/g, ' ')
  const slotIdInput = readImportField(row, ['slotId', 'slot id'])
  const academicSubject = context.academicSubjectByKey.get(importKey(subjectValue))
  const masterSubject = context.masterSubjectByCode.get(importKey(subjectValue))
  const masterDepartment = masterSubject
    ? context.departments.find((department) => department.id === masterSubject.departmentId)
    : undefined
  const teacher = context.teacherByKey.get(importKey(teacherValue))
  const naturalKey = classSection && day && Number.isInteger(periodNumber)
    ? `${importKey(classSection.id)}|${importKey(day)}|${periodNumber}`
    : ''
  const existingNaturalSlot = naturalKey ? context.timetableByNaturalKey.get(naturalKey) : undefined
  const generatedSlotId = classSection && day && Number.isInteger(periodNumber)
    ? `slot-${classSection.id}-${slugify(day)}-${periodNumber}`
    : makeImportId('slot', `${classValue}-${dayValue}-${periodNumber}`)
  const slotId = slotIdInput || existingNaturalSlot?.id || generatedSlotId
  const errors = []

  if (!classSection) {
    errors.push('Class Section must match an existing class section id or name.')
  }
  if (!academicDays.has(day)) {
    errors.push('Day must be Monday to Saturday.')
  }
  if (!Number.isInteger(periodNumber) || periodNumber < 1 || periodNumber > 12) {
    errors.push('Period Number must be between 1 and 12.')
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    errors.push('Start Time must use HH:MM format.')
  }
  if (!/^\d{2}:\d{2}$/.test(endTime)) {
    errors.push('End Time must use HH:MM format.')
  }
  if (/^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime >= endTime) {
    errors.push('End Time must be later than Start Time.')
  }
  if (!academicSubject && !masterSubject) {
    errors.push('Subject Code must match an academic or master subject.')
  }
  if (!teacher) {
    errors.push('Teacher must match an existing teacher id, email, or name.')
  }
  if (room.length < 2) {
    errors.push('Room is required.')
  }

  return {
    rowNumber,
    data: row,
    errors,
    conflicts: [],
    action: context.timetableById.has(slotId) ? 'update' : 'create',
    normalized: {
      id: slotId,
      classSectionId: classSection?.id ?? '',
      day,
      periodNumber,
      startTime,
      endTime,
      subjectId: academicSubject?.id ?? (masterSubject ? `sub-${slugify(masterSubject.code)}` : ''),
      subjectCode: academicSubject?.code ?? masterSubject?.code ?? '',
      subjectName: academicSubject?.name ?? masterSubject?.name ?? '',
      subjectDepartment: academicSubject?.department ?? masterDepartment?.name ?? '',
      teacherId: teacher?.id ?? '',
      room,
    },
  }
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(':').map(Number)
  return hours * 60 + minutes
}

function timetableSlotsOverlap(first, second) {
  if (first.day !== second.day) {
    return false
  }

  return timeToMinutes(first.startTime) < timeToMinutes(second.endTime)
    && timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
}

function addImportConflict(row, message) {
  const conflict = `Conflict: ${message}`
  if (!row.conflicts.includes(conflict)) {
    row.conflicts.push(conflict)
    row.errors.push(conflict)
  }
}

function timetableConflictMessages(first, second, context, location) {
  const messages = []
  const firstClass = context.classById.get(first.classSectionId)?.name ?? first.classSectionId
  const secondClass = context.classById.get(second.classSectionId)?.name ?? second.classSectionId
  const teacher = context.teacherById.get(first.teacherId)?.name ?? first.teacherId

  if (first.classSectionId === second.classSectionId) {
    messages.push(`${firstClass} already has ${location} on ${second.day} from ${second.startTime} to ${second.endTime}.`)
  }
  if (first.teacherId === second.teacherId) {
    messages.push(`${teacher} is already assigned ${location} on ${second.day} from ${second.startTime} to ${second.endTime}.`)
  }
  if (importKey(first.room) === importKey(second.room)) {
    messages.push(`Room ${first.room} is already used by ${secondClass} ${location} on ${second.day} from ${second.startTime} to ${second.endTime}.`)
  }

  return messages
}

function applyTimetableConflicts(rows, context) {
  const candidates = rows.filter((row) => row.errors.length === 0)
  const replacedSlotIds = new Set(candidates.map((row) => row.normalized.id))

  candidates.forEach((row) => {
    context.academic.slots.forEach((existing) => {
      if (replacedSlotIds.has(existing.id) || !timetableSlotsOverlap(row.normalized, existing)) {
        return
      }

      timetableConflictMessages(row.normalized, existing, context, 'in the existing timetable')
        .forEach((message) => addImportConflict(row, message))
    })
  })

  for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
      const first = candidates[firstIndex]
      const second = candidates[secondIndex]

      if (first.normalized.id === second.normalized.id) {
        const className = context.classById.get(first.normalized.classSectionId)?.name ?? first.normalized.classSectionId
        const message = `${className} ${first.normalized.day} period ${first.normalized.periodNumber} appears more than once in this file.`
        addImportConflict(first, message)
        addImportConflict(second, message)
        continue
      }

      if (!timetableSlotsOverlap(first.normalized, second.normalized)) {
        continue
      }

      timetableConflictMessages(first.normalized, second.normalized, context, `in uploaded row ${second.rowNumber}`)
        .forEach((message) => addImportConflict(first, message))
      timetableConflictMessages(second.normalized, first.normalized, context, `in uploaded row ${first.rowNumber}`)
        .forEach((message) => addImportConflict(second, message))
    }
  }
}

function validateImportRows(kind, rows) {
  if (!importKinds.has(kind)) {
    throw new Error('Unsupported import type.')
  }

  const context = makeImportContext()
  const validator = {
    students: validateImportStudent,
    staff: validateImportStaff,
    subjects: validateImportSubject,
    timetable: validateImportTimetable,
  }[kind]

  const reviewedRows = (Array.isArray(rows) ? rows : [])
    .slice(0, 1000)
    .map((row, index) => {
      const reviewed = validator(row, index + 2, context)
      return {
        ...reviewed,
        conflicts: reviewed.conflicts ?? [],
      }
    })

  if (kind === 'timetable') {
    applyTimetableConflicts(reviewedRows, context)
  }

  const validRows = reviewedRows.filter((row) => row.errors.length === 0)
  const invalidRows = reviewedRows.filter((row) => row.errors.length > 0)

  return {
    version: 1,
    kind,
    totalRows: reviewedRows.length,
    validRows,
    invalidRows,
    summary: {
      valid: validRows.length,
      invalid: invalidRows.length,
      creates: validRows.filter((row) => row.action === 'create').length,
      updates: validRows.filter((row) => row.action === 'update').length,
      conflicts: reviewedRows.filter((row) => row.conflicts.length > 0).length,
    },
  }
}

function upsertImportedStudent(student) {
  const result = db
    .prepare(`
      UPDATE academic_students
      SET name = ?, class_section_id = ?, email = ?
      WHERE roll_no = ?
    `)
    .run(student.name, student.classSectionId, student.email, student.rollNo)

  if (result.changes === 0) {
    insertAcademicStudentStatement.run(student.id, student.rollNo, student.name, student.classSectionId, student.email)
  }
}

function upsertImportedStaff(staff) {
  const staffResult = db
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
      staff.teacherId,
      staff.employeeCode,
      staff.name,
      staff.department,
      staff.designation,
      staff.email,
      staff.phone,
      staff.status,
      staff.joinedAt,
      staff.officeRoom,
      staff.id,
    )

  if (staffResult.changes === 0) {
    insertStaffProfileStatement.run(
      staff.id,
      staff.teacherId,
      staff.employeeCode,
      staff.name,
      staff.department,
      staff.designation,
      staff.email,
      staff.phone,
      staff.status,
      staff.joinedAt,
      staff.officeRoom,
    )
  }

  const teacherResult = db
    .prepare(`
      UPDATE academic_teachers
      SET name = ?, department = ?, email = ?
      WHERE id = ?
    `)
    .run(staff.name, staff.department, staff.email, staff.teacherId)

  if (teacherResult.changes === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO academic_teachers (id, name, department, email)
      VALUES (?, ?, ?, ?)
    `).run(staff.teacherId, staff.name, staff.department, staff.email)
  }
}

function upsertImportedSubject(subject) {
  const masterResult = db
    .prepare(`
      UPDATE subjects
      SET
        department_id = ?,
        semester = ?,
        name = ?,
        credits = ?,
        kind = ?,
        default_faculty = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = ?
    `)
    .run(
      subject.departmentId,
      subject.semester,
      subject.name,
      subject.credits,
      subject.kind,
      subject.defaultFaculty,
      subject.status,
      subject.code,
    )

  if (masterResult.changes === 0) {
    insertSubjectStatement.run(
      subject.id,
      subject.departmentId,
      subject.semester,
      subject.code,
      subject.name,
      subject.credits,
      subject.kind,
      subject.defaultFaculty,
      subject.status,
    )
  }

  const academicResult = db
    .prepare(`
      UPDATE academic_subjects
      SET name = ?, department = ?
      WHERE code = ?
    `)
    .run(subject.name, subject.departmentName, subject.code)

  if (academicResult.changes === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO academic_subjects (id, code, name, department)
      VALUES (?, ?, ?, ?)
    `).run(subject.academicSubjectId, subject.code, subject.name, subject.departmentName)
  }
}

function upsertImportedTimetableSlot(slot) {
  const subjectExists = db.prepare('SELECT id FROM academic_subjects WHERE id = ?').get(slot.subjectId)
  if (!subjectExists && slot.subjectCode) {
    db.prepare(`
      INSERT OR IGNORE INTO academic_subjects (id, code, name, department)
      VALUES (?, ?, ?, ?)
    `).run(slot.subjectId, slot.subjectCode, slot.subjectName || slot.subjectCode, slot.subjectDepartment || 'Imported')
  }

  const result = db
    .prepare(`
      UPDATE academic_timetable_slots
      SET
        class_section_id = ?,
        day = ?,
        period_number = ?,
        start_time = ?,
        end_time = ?,
        subject_id = ?,
        teacher_id = ?,
        room = ?
      WHERE id = ?
    `)
    .run(
      slot.classSectionId,
      slot.day,
      slot.periodNumber,
      slot.startTime,
      slot.endTime,
      slot.subjectId,
      slot.teacherId,
      slot.room,
      slot.id,
    )

  if (result.changes === 0) {
    insertTimetableSlotStatement.run(
      slot.id,
      slot.classSectionId,
      slot.day,
      slot.periodNumber,
      slot.startTime,
      slot.endTime,
      slot.subjectId,
      slot.teacherId,
      slot.room,
    )
  }
}

function importKindLabel(kind) {
  return {
    students: 'students',
    staff: 'staff profiles',
    subjects: 'subjects',
    timetable: 'timetable slots',
  }[kind] ?? 'records'
}

export function previewImportRows(kind, rows) {
  return validateImportRows(kind, rows)
}

export function commitImportRows(kind, rows, actor = 'CampusOps Admin') {
  const preview = validateImportRows(kind, rows)
  const upsert = {
    students: upsertImportedStudent,
    staff: upsertImportedStaff,
    subjects: upsertImportedSubject,
    timetable: upsertImportedTimetableSlot,
  }[kind]

  db.exec('BEGIN')
  try {
    preview.validRows.forEach((row) => upsert(row.normalized))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  const label = importKindLabel(kind)
  const auditEvent = createAuditEvent({
    actor,
    action: 'Imported data',
    outcome: `${preview.validRows.length} ${label} imported; ${preview.invalidRows.length} rows rejected.`,
    severity: preview.invalidRows.length > 0 ? 'warning' : 'success',
  })

  return {
    ...preview,
    importedRows: preview.validRows.length,
    auditEvent,
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
    institutionProfile: getInstitutionProfile(),
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
  const attendanceThreshold = context.institutionProfile?.attendanceThreshold ?? 75

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
    .filter((row) => row.totalMarked > 0 && row.attendancePercent < attendanceThreshold)
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

function tokenizeNoticeQuery(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 12)
}

function formatCircularAudienceLabel(circular) {
  if (circular.audience.type === 'department') {
    return circular.audience.department
  }

  if (circular.audience.type === 'class') {
    return circular.audience.classSectionId
  }

  if (circular.audience.type === 'students') {
    return 'All students'
  }

  if (circular.audience.type === 'faculty') {
    return 'All faculty'
  }

  return 'Everyone'
}

function rankCircularPriority(priority) {
  return {
    urgent: 0,
    important: 1,
    normal: 2,
  }[priority] ?? 3
}

function daysUntilDate(dateValue) {
  if (!dateValue) {
    return null
  }

  const todayMs = Date.parse(currentDateString())
  const dateMs = Date.parse(dateValue)
  if (!Number.isFinite(todayMs) || !Number.isFinite(dateMs)) {
    return null
  }

  return Math.ceil((dateMs - todayMs) / 86_400_000)
}

function circularDeadlineLabel(circular) {
  const daysUntil = daysUntilDate(circular.expiresAt)
  if (daysUntil === null) {
    return 'No expiry'
  }
  if (daysUntil < 0) {
    return `Expired ${Math.abs(daysUntil)} days ago`
  }
  if (daysUntil === 0) {
    return 'Expires today'
  }
  if (daysUntil === 1) {
    return 'Expires tomorrow'
  }
  return `Expires in ${daysUntil} days`
}

function scoreCircularForQuery(circular, tokens) {
  if (tokens.length === 0) {
    return circular.priority === 'urgent' ? 12 : circular.priority === 'important' ? 8 : 4
  }

  const haystack = `${circular.title} ${circular.body} ${circular.priority} ${formatCircularAudienceLabel(circular)} ${circular.attachmentName ?? ''}`.toLowerCase()
  const title = circular.title.toLowerCase()
  return tokens.reduce((score, token) => {
    if (!haystack.includes(token)) {
      return score
    }

    const titleBoost = title.includes(token) ? 6 : 0
    const priorityBoost = circular.priority.includes(token) ? 4 : 0
    const frequency = haystack.split(token).length - 1
    return score + titleBoost + priorityBoost + Math.min(frequency, 6)
  }, 0)
}

function makeCircularSnippet(circular, tokens) {
  const text = `${circular.title}. ${circular.body}`.replace(/\s+/g, ' ')
  if (tokens.length === 0) {
    return text.slice(0, 240)
  }

  const lower = text.toLowerCase()
  const firstHit = tokens
    .map((token) => lower.indexOf(token))
    .filter((index) => index >= 0)
    .sort((first, second) => first - second)[0]
  const start = firstHit >= 0 ? Math.max(firstHit - 70, 0) : 0
  const snippet = text.slice(start, start + 240)
  return `${start > 0 ? '...' : ''}${snippet}${start + 240 < text.length ? '...' : ''}`
}

function isCircularVisibleForActor(circular, sessionUser, context) {
  if (sessionUser.role === 'admin') {
    return true
  }

  if (circular.audience.type === 'everyone') {
    return true
  }

  if (circular.audience.type === 'students') {
    return sessionUser.role === 'student'
  }

  if (circular.audience.type === 'faculty') {
    return sessionUser.role === 'faculty'
  }

  if (circular.audience.type === 'class') {
    return context.students.some(
      (student) => student.id === sessionUser.actorId && student.classSectionId === circular.audience.classSectionId,
    )
  }

  if (circular.audience.type === 'department') {
    const targetDepartment = normalizeValue(circular.audience.department)
    if (sessionUser.role === 'faculty') {
      const teacher = context.teachers.find((item) => item.id === sessionUser.actorId)
      return normalizeValue(normalizeDepartmentName(teacher?.department ?? '')) === targetDepartment
    }

    const student = context.students.find((item) => item.id === sessionUser.actorId)
    const section = context.classSections.find((item) => item.id === student?.classSectionId)
    return normalizeValue(normalizeDepartmentName(section?.program ?? '')) === targetDepartment
  }

  return false
}

export function searchCircularIntelligence(input = {}, sessionUser = { role: 'admin', actorId: '', name: 'CampusOps' }) {
  const query = safeString(input.query)
  const tokens = tokenizeNoticeQuery(query)
  const context = {
    ...getAcademicState(),
    circulars: getCirculars(),
    readReceipts: getCircularReadReceipts(),
  }
  const receiptsForActor = new Set(
    context.readReceipts
      .filter((receipt) => receipt.actorId === sessionUser.actorId)
      .map((receipt) => receipt.circularId),
  )

  const visibleCirculars = context.circulars
    .filter((circular) => isCircularVisibleForActor(circular, sessionUser, context))
    .map((circular) => {
      const score = scoreCircularForQuery(circular, tokens)
      const active = isCircularActive(circular)
      const read = receiptsForActor.has(circular.id)
      const daysUntil = daysUntilDate(circular.expiresAt)

      return {
        circular,
        score,
        active,
        read,
        daysUntil,
      }
    })

  const matchedCirculars = visibleCirculars
    .filter((item) => tokens.length === 0 || item.score > 0)
    .sort((first, second) => {
      const priorityDelta = rankCircularPriority(first.circular.priority) - rankCircularPriority(second.circular.priority)
      return second.score - first.score || priorityDelta || second.circular.publishedAt.localeCompare(first.circular.publishedAt)
    })

  const citations = matchedCirculars.slice(0, 6).map((item) => ({
    id: item.circular.id,
    title: item.circular.title,
    priority: item.circular.priority,
    audience: formatCircularAudienceLabel(item.circular),
    publishedAt: item.circular.publishedAt,
    expiresAt: item.circular.expiresAt ?? '',
    deadline: circularDeadlineLabel(item.circular),
    active: item.active,
    read: item.read,
    snippet: makeCircularSnippet(item.circular, tokens),
    attachmentName: item.circular.attachmentName ?? '',
    score: item.score,
  }))

  const activeVisible = visibleCirculars.filter((item) => item.active)
  const unreadVisible = activeVisible.filter((item) => !item.read)
  const urgentVisible = activeVisible.filter((item) => item.circular.priority === 'urgent')
  const deadlines = activeVisible
    .filter((item) => item.daysUntil !== null && item.daysUntil <= 7)
    .sort((first, second) => (first.daysUntil ?? 99) - (second.daysUntil ?? 99))
    .slice(0, 5)
    .map((item) => ({
      id: item.circular.id,
      title: item.circular.title,
      priority: item.circular.priority,
      audience: formatCircularAudienceLabel(item.circular),
      expiresAt: item.circular.expiresAt ?? '',
      deadline: circularDeadlineLabel(item.circular),
    }))

  const answer = citations.length > 0
    ? citations
        .slice(0, 3)
        .map((citation) => `${citation.title}: ${citation.snippet}`)
        .join('\n\n')
    : 'No matching circular was found for this question.'

  createAuditEvent({
    actor: sessionUser.name ?? 'CampusOps',
    action: 'Searched circular intelligence',
    outcome: `${citations.length} circular citations found for "${query || 'notice summary'}".`,
    severity: citations.length > 0 ? 'info' : 'warning',
  })

  return {
    version: 1,
    source: 'sqlite',
    query,
    generatedAt: new Date().toISOString(),
    answer,
    stats: {
      visible: visibleCirculars.length,
      active: activeVisible.length,
      unread: unreadVisible.length,
      urgent: urgentVisible.length,
      deadlines: deadlines.length,
    },
    citations,
    deadlines,
  }
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

function academicDayForDate(dateValue) {
  if (!dateValue) {
    return ''
  }

  const date = new Date(`${dateValue}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
}

function actionSeverityRank(severity) {
  return {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  }[severity] ?? 4
}

function makeActionItem(input) {
  return {
    id: input.id,
    category: input.category,
    severity: input.severity,
    title: input.title,
    detail: input.detail,
    owner: input.owner,
    dueDate: input.dueDate ?? '',
    source: input.source,
    targetSection: input.targetSection,
    actionLabel: input.actionLabel,
    status: 'open',
    metricLabel: input.metricLabel ?? '',
    metricValue: input.metricValue ?? '',
  }
}

function getAttendanceGapActionItems(context, filters) {
  const indexes = buildIndexes(context)
  const attendanceDates = context.attendance.map((record) => record.date).sort()
  const selectedDate = filters.date || attendanceDates.at(-1) || currentDateString()
  const selectedDay = academicDayForDate(selectedDate)

  if (!academicDays.has(selectedDay)) {
    return []
  }

  const markedKeys = new Set(
    context.attendance
      .filter((record) => record.date === selectedDate)
      .map((record) => `${record.slotId}:${record.studentId}`),
  )

  return context.slots
    .filter((slot) => slot.day === selectedDay)
    .filter((slot) => filters.role !== 'faculty' || !filters.actorId || slot.teacherId === filters.actorId)
    .map((slot) => {
      const section = indexes.sectionById.get(slot.classSectionId)
      const teacher = indexes.teacherById.get(slot.teacherId)
      const subject = indexes.subjectById.get(slot.subjectId)
      const department = getSlotDepartment(slot, indexes)
      const students = context.students.filter((student) => student.classSectionId === slot.classSectionId)
      const missingCount = students.filter((student) => !markedKeys.has(`${slot.id}:${student.id}`)).length

      return {
        slot,
        section,
        teacher,
        subject,
        department,
        students,
        missingCount,
      }
    })
    .filter((row) => row.missingCount > 0)
    .filter((row) => reportDepartmentMatches(row.department, filters.department))
    .filter((row) => reportSemesterMatches(row.section?.semester, filters.semester))
    .map((row) =>
      makeActionItem({
        id: `ACTION-ATT-${selectedDate}-${row.slot.id}`,
        category: 'Attendance',
        severity: row.missingCount === row.students.length ? 'critical' : 'warning',
        title: `Attendance not fully marked: ${row.section?.name ?? 'Class'} P${row.slot.periodNumber}`,
        detail: `${row.missingCount} of ${row.students.length} students still need attendance for ${row.subject?.name ?? 'mapped subject'} on ${selectedDate}.`,
        owner: row.teacher?.name ?? 'Faculty',
        dueDate: selectedDate,
        source: 'Daily attendance check',
        targetSection: 'academics',
        actionLabel: 'Open academics',
        metricLabel: 'Missing',
        metricValue: `${row.missingCount}/${row.students.length}`,
      }),
    )
}

function getActionCenterItems(context, filters) {
  const attendanceGaps = getAttendanceGapActionItems(context, filters)
  const pendingLeaves = getPendingLeaveReport(context, { ...filters, status: 'pending' }).map((leave) =>
    makeActionItem({
      id: `ACTION-LEAVE-${leave.id}`,
      category: 'Leave',
      severity: leave.date < currentDateString() ? 'critical' : 'warning',
      title: `Leave approval pending: ${leave.studentName}`,
      detail: `${leave.rollNo} requested ${leave.reason.toLowerCase()} for ${leave.subjectName}, period ${leave.periodNumber}.`,
      owner: leave.reviewerName,
      dueDate: leave.date,
      source: 'Pending leave report',
      targetSection: 'academics',
      actionLabel: 'Review leave',
      metricLabel: 'Request',
      metricValue: leave.id,
    }),
  )
  const facultyWorkload = getFacultyWorkloadReport(context, { ...filters, status: 'overloaded' }).map((teacher) =>
    makeActionItem({
      id: `ACTION-WORKLOAD-${teacher.teacherId}`,
      category: 'Workload',
      severity: teacher.assignedSlots >= 4 ? 'critical' : 'warning',
      title: `High timetable load: ${teacher.teacherName}`,
      detail: `${teacher.assignedSlots} slots across ${teacher.uniqueSubjects} subjects and ${teacher.classSections} class sections.`,
      owner: teacher.teacherName,
      source: 'Faculty workload report',
      targetSection: filters.role === 'faculty' ? 'reports' : 'staff',
      actionLabel: filters.role === 'faculty' ? 'Open my reports' : 'Open staff',
      metricLabel: 'Slots',
      metricValue: teacher.assignedSlots,
    }),
  )

  if (filters.role === 'faculty') {
    return [...attendanceGaps, ...pendingLeaves, ...facultyWorkload]
  }

  const attendanceShortage = getAttendanceShortageReport(context, { ...filters, status: 'shortage' }).map((student) =>
    makeActionItem({
      id: `ACTION-SHORTAGE-${student.studentId}`,
      category: 'Attendance',
      severity: student.attendancePercent < Math.max(1, context.institutionProfile.attendanceThreshold - 15) ? 'critical' : 'warning',
      title: `Attendance shortage: ${student.studentName}`,
      detail: `${student.rollNo} is at ${student.attendancePercent}% attendance in ${student.className}; last marked ${student.lastMarkedDate}.`,
      owner: student.className,
      dueDate: student.lastMarkedDate,
      source: 'Attendance shortage report',
      targetSection: 'reports',
      actionLabel: 'Open reports',
      metricLabel: 'Attendance',
      metricValue: `${student.attendancePercent}%`,
    }),
  )
  const coverageGaps = getDepartmentSubjectCoverageReport(context, { ...filters, status: 'unmapped' })
    .filter((row) => row.unmappedSubjects > 0)
    .map((row) =>
      makeActionItem({
        id: `ACTION-COVERAGE-${row.departmentId}-${row.semester}`,
        category: 'Mapping',
        severity: 'warning',
        title: `Subject coverage gap: ${row.departmentName} Sem ${row.semester}`,
        detail: `${row.unmappedSubjects} subjects are not mapped in timetable: ${row.unmappedSubjectCodes}.`,
        owner: row.departmentCode,
        source: 'Department subject coverage report',
        targetSection: 'imports',
        actionLabel: 'Open imports',
        metricLabel: 'Coverage',
        metricValue: `${row.coveragePercent}%`,
      }),
    )
  const inactiveRecords = getInactiveMasterDataReport(context, { ...filters, status: 'inactive' }).map((record) =>
    makeActionItem({
      id: `ACTION-INACTIVE-${record.type}-${record.id}`,
      category: 'Master data',
      severity: 'info',
      title: `Inactive ${record.type.toLowerCase()}: ${record.name}`,
      detail: `${record.code} is inactive; owner ${record.owner}. ${record.detail}.`,
      owner: record.owner,
      source: 'Inactive master data report',
      targetSection: 'master-data',
      actionLabel: 'Open master data',
      metricLabel: 'Status',
      metricValue: record.status,
    }),
  )
  const circulars = getCircularEngagementReport(context, { ...filters, status: 'unread' })
    .filter((circular) => circular.active && circular.unreadCount > 0)
    .map((circular) =>
      makeActionItem({
        id: `ACTION-CIRCULAR-${circular.id}`,
        category: 'Circulars',
        severity: circular.priority === 'urgent' ? 'critical' : 'warning',
        title: `Circular unread: ${circular.title}`,
        detail: `${circular.unreadCount} recipients have not read this ${circular.priority} notice for ${circular.audience}.`,
        owner: circular.audience,
        dueDate: circular.publishedAt,
        source: 'Circular engagement report',
        targetSection: 'circulars',
        actionLabel: 'Open circulars',
        metricLabel: 'Read rate',
        metricValue: `${circular.readRate}%`,
      }),
    )

  return [
    ...attendanceGaps,
    ...pendingLeaves,
    ...attendanceShortage,
    ...facultyWorkload,
    ...coverageGaps,
    ...inactiveRecords,
    ...circulars,
  ]
}

function summarizeActionItems(items) {
  const count = (predicate) => items.filter(predicate).length

  return {
    total: items.length,
    critical: count((item) => item.severity === 'critical'),
    warning: count((item) => item.severity === 'warning'),
    info: count((item) => item.severity === 'info'),
    attendanceGaps: count((item) => item.source === 'Daily attendance check'),
    pendingLeaves: count((item) => item.category === 'Leave'),
    shortageStudents: count((item) => item.source === 'Attendance shortage report'),
    overloadedFaculty: count((item) => item.category === 'Workload'),
    coverageGaps: count((item) => item.category === 'Mapping'),
    inactiveRecords: count((item) => item.category === 'Master data'),
    circularsWithUnread: count((item) => item.category === 'Circulars'),
  }
}

function getActionCenterCategories(items) {
  const categoryCounts = new Map()
  items.forEach((item) => {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1)
  })

  return Array.from(categoryCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
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

export function getActionCenter(filters = {}) {
  const cleanFilters = normalizeReportFilters(filters)
  const context = getReportContext()
  const items = getActionCenterItems(context, cleanFilters).sort((first, second) => {
    const severityDelta = actionSeverityRank(first.severity) - actionSeverityRank(second.severity)
    return severityDelta || first.dueDate.localeCompare(second.dueDate) || first.title.localeCompare(second.title)
  })
  const filterOptions = getReportFilterOptions(context)

  return {
    version: 1,
    source: 'sqlite',
    generatedAt: new Date().toISOString(),
    attendanceThreshold: context.institutionProfile.attendanceThreshold,
    filters: cleanFilters,
    filterOptions: {
      departments: filterOptions.departments,
      semesters: filterOptions.semesters,
      dates: filterOptions.dates,
      categories: getActionCenterCategories(items).map((category) => category.label),
      severities: ['all', 'critical', 'warning', 'info'],
    },
    summary: summarizeActionItems(items),
    categories: getActionCenterCategories(items),
    items,
  }
}

const automationSeverityRank = {
  info: 1,
  warning: 2,
  critical: 3,
}

function parseAutomationJson(value, fallback) {
  try {
    return JSON.parse(value || '')
  } catch {
    return fallback
  }
}

function rowToAutomationRule(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    triggerType: row.triggerType,
    condition: parseAutomationJson(row.conditionJson, {}),
    action: parseAutomationJson(row.actionJson, {}),
    approvalRequired: Boolean(row.approvalRequired),
    enabled: Boolean(row.enabled),
    cooldownMinutes: row.cooldownMinutes,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function rowToAutomationRun(row) {
  return {
    id: row.id,
    ruleId: row.ruleId,
    ruleName: row.ruleName,
    category: row.category,
    status: row.status,
    matchCount: row.matchCount,
    notificationCount: row.notificationCount,
    attempt: row.attempt,
    summary: row.summary,
    errorMessage: row.errorMessage,
    startedBy: row.startedBy,
    decidedBy: row.decidedBy ?? '',
    decidedAt: row.decidedAt ?? '',
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? '',
  }
}

function rowToAutomationNotification(row) {
  return {
    id: row.id,
    runId: row.runId,
    ruleName: row.ruleName,
    recipient: row.recipient,
    channel: row.channel,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
    sentAt: row.sentAt ?? '',
    readAt: row.readAt ?? '',
  }
}

function getAutomationRules() {
  return db.prepare(`
    SELECT
      id,
      name,
      description,
      category,
      trigger_type AS triggerType,
      condition_json AS conditionJson,
      action_json AS actionJson,
      approval_required AS approvalRequired,
      enabled,
      cooldown_minutes AS cooldownMinutes,
      created_by AS createdBy,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM automation_rules
    ORDER BY category, name
  `).all().map(rowToAutomationRule)
}

function getAutomationRuns(limit = 40) {
  return db.prepare(`
    SELECT
      r.id,
      r.rule_id AS ruleId,
      rule.name AS ruleName,
      rule.category,
      r.status,
      r.match_count AS matchCount,
      r.notification_count AS notificationCount,
      r.attempt,
      r.summary,
      r.error_message AS errorMessage,
      r.started_by AS startedBy,
      r.decided_by AS decidedBy,
      r.decided_at AS decidedAt,
      r.started_at AS startedAt,
      r.completed_at AS completedAt
    FROM automation_runs r
    JOIN automation_rules rule ON rule.id = r.rule_id
    ORDER BY r.started_at DESC, r.id DESC
    LIMIT ?
  `).all(limit).map(rowToAutomationRun)
}

function getLatestAutomationRun(ruleId) {
  const row = db.prepare(`
    SELECT
      r.id,
      r.rule_id AS ruleId,
      rule.name AS ruleName,
      rule.category,
      r.status,
      r.match_count AS matchCount,
      r.notification_count AS notificationCount,
      r.attempt,
      r.summary,
      r.error_message AS errorMessage,
      r.started_by AS startedBy,
      r.decided_by AS decidedBy,
      r.decided_at AS decidedAt,
      r.started_at AS startedAt,
      r.completed_at AS completedAt
    FROM automation_runs r
    JOIN automation_rules rule ON rule.id = r.rule_id
    WHERE r.rule_id = ?
    ORDER BY r.started_at DESC, r.id DESC
    LIMIT 1
  `).get(ruleId)
  return row ? rowToAutomationRun(row) : null
}

function getAutomationNotifications(limit = 40) {
  return db.prepare(`
    SELECT
      notification.id,
      notification.run_id AS runId,
      rule.name AS ruleName,
      notification.recipient,
      notification.channel,
      notification.subject,
      notification.message,
      notification.status,
      notification.created_at AS createdAt,
      notification.sent_at AS sentAt,
      notification.read_at AS readAt
    FROM automation_notifications notification
    JOIN automation_runs run ON run.id = notification.run_id
    JOIN automation_rules rule ON rule.id = run.rule_id
    ORDER BY notification.created_at DESC, notification.id DESC
    LIMIT ?
  `).all(limit).map(rowToAutomationNotification)
}

function automationSignalItems(rule) {
  const minimumSeverity = safeString(rule.condition?.minimumSeverity) || 'info'
  const minimumRank = automationSeverityRank[minimumSeverity] ?? automationSeverityRank.info
  const actionItems = getActionCenter({ role: 'admin' }).items
  const relevantActions = actionItems.filter((item) => {
    if (rule.triggerType === 'attendance_gap') return item.source === 'Daily attendance check'
    if (rule.triggerType === 'pending_leave') return item.category === 'Leave'
    if (rule.triggerType === 'attendance_shortage') return item.source === 'Attendance shortage report'
    if (rule.triggerType === 'circular_unread') return item.category === 'Circulars'
    return false
  })

  if (rule.triggerType !== 'policy_expiry') {
    return relevantActions
      .filter((item) => (automationSeverityRank[item.severity] ?? 0) >= minimumRank)
      .slice(0, 100)
  }

  const today = currentDateString()
  const todayMs = Date.parse(`${today}T00:00:00Z`)
  const daysBefore = Math.max(1, Math.min(Number(rule.condition?.daysBefore) || 30, 365))
  return getKnowledgeDocuments({ role: 'admin' })
    .filter((document) => document.status === 'active' && document.expiresAt)
    .map((document) => ({
      document,
      daysRemaining: Math.ceil((Date.parse(`${document.expiresAt}T00:00:00Z`) - todayMs) / 86_400_000),
    }))
    .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= daysBefore)
    .map(({ document, daysRemaining }) => ({
      id: `ACTION-POLICY-${document.id}`,
      category: 'Knowledge',
      severity: daysRemaining <= 7 ? 'critical' : 'warning',
      title: `Policy expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}: ${document.title}`,
      detail: `${document.source} version ${document.versionLabel} expires on ${document.expiresAt}. Review or replace the approved source before retrieval stops.`,
      owner: document.owner,
      dueDate: document.expiresAt,
      source: 'Policy lifecycle check',
      targetSection: 'knowledge',
      actionLabel: 'Open knowledge',
      status: 'open',
      metricLabel: 'Days left',
      metricValue: daysRemaining,
    }))
    .slice(0, 100)
}

function automationSignalKey(rule, signals, force = false) {
  const cooldownMs = Math.max(1, rule.cooldownMinutes) * 60_000
  const timeBucket = Math.floor(Date.now() / cooldownMs)
  const fingerprint = JSON.stringify({
    ruleId: rule.id,
    timeBucket,
    signalIds: signals.map((signal) => signal.id).sort(),
    force: force ? randomUUID() : '',
  })
  return createHash('sha256').update(fingerprint).digest('hex')
}

function createAutomationNotifications(runId, rule, signals) {
  const signalsByRecipient = new Map()
  signals.forEach((signal) => {
    const recipient = safeString(signal.owner) || 'Admin Office'
    const existing = signalsByRecipient.get(recipient) ?? []
    existing.push(signal)
    signalsByRecipient.set(recipient, existing)
  })

  const insertNotification = db.prepare(`
    INSERT INTO automation_notifications (
      id, run_id, recipient, channel, subject, message, status, sent_at
    )
    VALUES (?, ?, ?, 'in_app', ?, ?, 'sent', CURRENT_TIMESTAMP)
  `)

  signalsByRecipient.forEach((recipientSignals, recipient) => {
    const preview = recipientSignals.slice(0, 3).map((signal) => signal.title).join('; ')
    const remaining = Math.max(0, recipientSignals.length - 3)
    insertNotification.run(
      `NOTIFY-${Date.now()}-${randomUUID().slice(0, 8)}`,
      runId,
      recipient,
      rule.name,
      `${preview}${remaining > 0 ? `; and ${remaining} more item${remaining === 1 ? '' : 's'}` : ''}`,
    )
  })

  const notificationCount = signalsByRecipient.size
  db.prepare('UPDATE automation_runs SET notification_count = ? WHERE id = ?').run(notificationCount, runId)
  return notificationCount
}

function getAutomationRunRecord(id) {
  return db.prepare(`
    SELECT
      r.*,
      rule.name AS rule_name,
      rule.category AS rule_category
    FROM automation_runs r
    JOIN automation_rules rule ON rule.id = r.rule_id
    WHERE r.id = ?
  `).get(id)
}

function executeAutomationRule(rule, actor, options = {}) {
  const signals = automationSignalItems(rule)
  const signalKey = automationSignalKey(rule, signals, options.force)
  const existing = db.prepare('SELECT id FROM automation_runs WHERE signal_key = ?').get(signalKey)
  if (existing) {
    return {
      ...getAutomationRuns(100).find((run) => run.id === existing.id),
      deduplicated: true,
    }
  }

  const runId = `AUTO-${Date.now()}-${randomUUID().slice(0, 8)}`
  const status = signals.length === 0
    ? 'no_match'
    : rule.approvalRequired
      ? 'awaiting_approval'
      : 'completed'
  const summary = signals.length === 0
    ? `${rule.name} checked live college data and found no matching work.`
    : `${signals.length} live signal${signals.length === 1 ? '' : 's'} matched ${rule.name}.`
  const completedAt = ['completed', 'no_match'].includes(status) ? new Date().toISOString() : null

  db.prepare(`
    INSERT INTO automation_runs (
      id, rule_id, signal_key, status, match_count, notification_count, attempt,
      summary, payload_json, error_message, started_by, completed_at
    )
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, '', ?, ?)
  `).run(
    runId,
    rule.id,
    signalKey,
    status,
    signals.length,
    Number(options.attempt) || 1,
    summary,
    JSON.stringify(signals),
    actor,
    completedAt,
  )

  if (status === 'completed') {
    createAutomationNotifications(runId, rule, signals)
  }

  return {
    ...getAutomationRuns(100).find((run) => run.id === runId),
    deduplicated: false,
  }
}

function recordFailedAutomationRun(rule, actor, error, attempt = 1) {
  const runId = `AUTO-${Date.now()}-${randomUUID().slice(0, 8)}`
  db.prepare(`
    INSERT INTO automation_runs (
      id, rule_id, signal_key, status, match_count, notification_count, attempt,
      summary, payload_json, error_message, started_by, completed_at
    )
    VALUES (?, ?, ?, 'failed', 0, 0, ?, ?, '[]', ?, ?, CURRENT_TIMESTAMP)
  `).run(
    runId,
    rule.id,
    `${rule.id}-failed-${randomUUID()}`,
    attempt,
    `${rule.name} could not complete.`,
    error instanceof Error ? error.message : 'Unknown automation error',
    actor,
  )
  return getAutomationRuns(100).find((run) => run.id === runId)
}

export function getAutomationState() {
  const rules = getAutomationRules()
  const runs = getAutomationRuns()
  const notifications = getAutomationNotifications()
  const today = currentDateString()
  const rulesWithLastRun = rules.map((rule) => ({
    ...rule,
    lastRun: getLatestAutomationRun(rule.id),
  }))
  const runSummary = db.prepare(`
    SELECT
      SUM(CASE WHEN date(started_at) = ? THEN 1 ELSE 0 END) AS runsToday,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedRuns,
      SUM(CASE WHEN status = 'awaiting_approval' THEN 1 ELSE 0 END) AS awaitingApproval,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedRuns
    FROM automation_runs
  `).get(today)
  const unreadNotifications = db.prepare(`
    SELECT COUNT(*) AS count
    FROM automation_notifications
    WHERE status = 'sent'
  `).get().count

  return {
    version: 1,
    source: 'sqlite',
    generatedAt: new Date().toISOString(),
    summary: {
      rules: rules.length,
      enabledRules: rules.filter((rule) => rule.enabled).length,
      runsToday: runSummary.runsToday ?? 0,
      completedRuns: runSummary.completedRuns ?? 0,
      awaitingApproval: runSummary.awaitingApproval ?? 0,
      failedRuns: runSummary.failedRuns ?? 0,
      unreadNotifications,
    },
    rules: rulesWithLastRun,
    runs,
    notifications,
  }
}

export function runAutomationRules(input = {}, actor = 'CampusOps Admin') {
  const requestedRuleId = safeString(input?.ruleId)
  const schedulerRun = input?.scheduler === true
  const allRules = getAutomationRules()
  const selectedRules = requestedRuleId
    ? allRules.filter((rule) => rule.id === requestedRuleId)
    : allRules.filter((rule) => rule.enabled)

  if (selectedRules.length === 0) {
    throw new Error(requestedRuleId ? 'Automation rule was not found.' : 'No automation rules are enabled.')
  }
  if (selectedRules.some((rule) => !rule.enabled)) {
    throw new Error('Enable the automation rule before running it.')
  }

  const runs = selectedRules.map((rule) => {
    try {
      return executeAutomationRule(rule, actor)
    } catch (error) {
      return recordFailedAutomationRun(rule, actor, error)
    }
  })
  const deduplicatedCount = runs.filter((run) => run.deduplicated).length
  const auditEvent = !schedulerRun || deduplicatedCount < runs.length
    ? createAuditEvent({
        actor,
        action: schedulerRun
          ? 'Scheduled automation check'
          : requestedRuleId
            ? 'Ran automation rule'
            : 'Ran automation checks',
        outcome: `${runs.length} rule${runs.length === 1 ? '' : 's'} checked; ${deduplicatedCount} duplicate run${deduplicatedCount === 1 ? '' : 's'} safely suppressed.`,
        severity: runs.some((run) => run.status === 'failed') ? 'warning' : 'success',
      })
    : null

  return {
    runs,
    auditEvent,
    state: getAutomationState(),
  }
}

export function updateAutomationRule(id, input = {}, actor = 'CampusOps Admin') {
  const current = getAutomationRules().find((rule) => rule.id === id)
  if (!current) {
    return null
  }

  const enabled = typeof input.enabled === 'boolean' ? input.enabled : current.enabled
  const approvalRequired = typeof input.approvalRequired === 'boolean'
    ? input.approvalRequired
    : current.approvalRequired
  const cooldownMinutes = input.cooldownMinutes === undefined
    ? current.cooldownMinutes
    : Number(input.cooldownMinutes)

  if (!Number.isInteger(cooldownMinutes) || cooldownMinutes < 1 || cooldownMinutes > 43_200) {
    throw new Error('Automation cooldown must be between 1 and 43,200 minutes.')
  }

  db.prepare(`
    UPDATE automation_rules
    SET enabled = ?, approval_required = ?, cooldown_minutes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(enabled ? 1 : 0, approvalRequired ? 1 : 0, cooldownMinutes, id)

  const rule = getAutomationRules().find((item) => item.id === id)
  const auditEvent = createAuditEvent({
    actor,
    action: 'Updated automation rule',
    outcome: `${rule.name} is ${rule.enabled ? 'enabled' : 'paused'} with a ${rule.cooldownMinutes}-minute cooldown${rule.approvalRequired ? ' and a human approval gate' : ''}.`,
    severity: 'info',
  })

  return {
    rule,
    auditEvent,
    state: getAutomationState(),
  }
}

export function decideAutomationRun(id, input = {}, actor = 'CampusOps Admin') {
  const decision = safeString(input?.decision).toLowerCase()
  if (!['approve', 'reject'].includes(decision)) {
    throw new Error('Automation decision must be approve or reject.')
  }

  const runRecord = getAutomationRunRecord(id)
  if (!runRecord) {
    return null
  }
  if (runRecord.status !== 'awaiting_approval') {
    throw new Error('Only automation runs awaiting approval can be decided.')
  }

  const rule = getAutomationRules().find((item) => item.id === runRecord.rule_id)
  const signals = parseAutomationJson(runRecord.payload_json, [])
  const nextStatus = decision === 'approve' ? 'completed' : 'rejected'
  db.prepare(`
    UPDATE automation_runs
    SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextStatus, actor, id)

  if (decision === 'approve') {
    createAutomationNotifications(id, rule, signals)
  }

  const auditEvent = createAuditEvent({
    actor,
    action: decision === 'approve' ? 'Approved automation run' : 'Rejected automation run',
    outcome: `${rule.name} ${decision === 'approve' ? 'completed and released its notifications' : 'was stopped before external action'}.`,
    severity: decision === 'approve' ? 'success' : 'warning',
  })

  return {
    run: getAutomationRuns(100).find((run) => run.id === id),
    auditEvent,
    state: getAutomationState(),
  }
}

export function retryAutomationRun(id, actor = 'CampusOps Admin') {
  const runRecord = getAutomationRunRecord(id)
  if (!runRecord) {
    return null
  }
  if (runRecord.status !== 'failed') {
    throw new Error('Only failed automation runs can be retried.')
  }

  const rule = getAutomationRules().find((item) => item.id === runRecord.rule_id)
  let run
  try {
    run = executeAutomationRule(rule, actor, { force: true, attempt: runRecord.attempt + 1 })
  } catch (error) {
    run = recordFailedAutomationRun(rule, actor, error, runRecord.attempt + 1)
  }
  const auditEvent = createAuditEvent({
    actor,
    action: 'Retried automation run',
    outcome: `${rule.name} retry attempt ${run.attempt} finished with status ${run.status}.`,
    severity: run.status === 'failed' ? 'warning' : 'success',
  })

  return {
    run,
    auditEvent,
    state: getAutomationState(),
  }
}

export function markAutomationNotificationRead(id) {
  const notification = db.prepare('SELECT id FROM automation_notifications WHERE id = ?').get(id)
  if (!notification) {
    return null
  }
  db.prepare(`
    UPDATE automation_notifications
    SET status = 'read', read_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id)
  return {
    notification: getAutomationNotifications(100).find((item) => item.id === id),
    state: getAutomationState(),
  }
}

export function resetAutomationData(actor = 'CampusOps Admin') {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM automation_notifications')
    db.exec('DELETE FROM automation_runs')
    db.exec('DELETE FROM automation_rules')
    seedAutomationRules.forEach((rule) => insertAutomationRule(rule, actor))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  const auditEvent = createAuditEvent({
    actor,
    action: 'Reset automation controls',
    outcome: 'Automation rules, runs, and in-app notifications were reset to college-safe defaults.',
    severity: 'warning',
  })
  return {
    ...getAutomationState(),
    auditEvent,
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
  const facultyLimited = cleanFilters.role === 'faculty'
  const visibleAttendanceShortage = facultyLimited ? [] : attendanceShortage
  const visibleDepartmentSubjectCoverage = facultyLimited ? [] : departmentSubjectCoverage
  const visibleInactiveMasterData = facultyLimited ? [] : inactiveMasterData
  const visibleCircularEngagement = facultyLimited ? [] : circularEngagement

  return {
    version: 1,
    source: 'sqlite',
    generatedAt: new Date().toISOString(),
    attendanceThreshold: context.institutionProfile.attendanceThreshold,
    filters: cleanFilters,
    filterOptions: getReportFilterOptions(context),
    kpis: {
      attendanceShortage: visibleAttendanceShortage.length,
      pendingLeaves: pendingLeave.filter((leave) => leave.status === 'pending').length,
      overloadedFaculty: facultyWorkload.filter((teacher) => teacher.loadStatus === 'overloaded').length,
      unmappedCoverageRows: visibleDepartmentSubjectCoverage.filter((row) => row.unmappedSubjects > 0).length,
      inactiveRecords: visibleInactiveMasterData.length,
      unreadCirculars: visibleCircularEngagement.reduce((total, row) => total + row.unreadCount, 0),
      markedAttendanceToday: dailySummary.markedAttendanceCount,
    },
    attendanceShortage: visibleAttendanceShortage,
    pendingLeave,
    facultyWorkload,
    departmentSubjectCoverage: visibleDepartmentSubjectCoverage,
    inactiveMasterData: visibleInactiveMasterData,
    circularEngagement: visibleCircularEngagement,
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

export function createActionAuditEvent(input) {
  const actor = safeString(input?.actor) || 'CampusOps Admin'
  const action = safeString(input?.action) || 'Action center activity'
  const actionItemTitle = safeString(input?.actionItemTitle) || 'Action item'
  const outcome = safeString(input?.outcome) || `${actionItemTitle} updated from Action Center.`
  const severity = ['info', 'success', 'warning', 'critical'].includes(input?.severity)
    ? input.severity
    : 'success'

  return createAuditEvent({
    actor,
    action,
    outcome,
    severity,
  })
}

export function getInstitutionProfile() {
  return db
    .prepare(`
      SELECT
        name,
        short_name AS shortName,
        code,
        academic_year AS academicYear,
        current_term AS currentTerm,
        timezone,
        attendance_threshold AS attendanceThreshold,
        email_domain AS emailDomain,
        website,
        updated_at AS updatedAt
      FROM institution_profile
      WHERE id = 'primary'
    `)
    .get()
}

function getInstitutionReadiness(profile, stats) {
  const steps = [
    {
      id: 'identity',
      label: 'College identity',
      detail: 'Replace the demonstration identity with your institution details.',
      complete: !profile.name.toLowerCase().includes('demonstration'),
      targetSection: 'college-setup',
    },
    {
      id: 'departments',
      label: 'Departments',
      detail: 'Add at least one active academic department.',
      complete: stats.departments > 0,
      targetSection: 'master-data',
    },
    {
      id: 'subjects',
      label: 'Subject catalog',
      detail: 'Create the subjects used by timetables and reports.',
      complete: stats.subjects > 0,
      targetSection: 'master-data',
    },
    {
      id: 'people',
      label: 'Students and staff',
      detail: 'Load active student and staff registers.',
      complete: stats.students > 0 && stats.staff > 0,
      targetSection: 'imports',
    },
    {
      id: 'timetable',
      label: 'Timetable mapping',
      detail: 'Map subjects, faculty, rooms, and class periods.',
      complete: stats.timetableSlots > 0,
      targetSection: 'academics',
    },
    {
      id: 'knowledge',
      label: 'Policy knowledge',
      detail: 'Add institutional policies for cited office answers.',
      complete: stats.knowledgeDocuments > 0,
      targetSection: 'knowledge',
    },
    {
      id: 'communications',
      label: 'Campus communication',
      detail: 'Publish a circular and validate audience targeting.',
      complete: stats.circulars > 0,
      targetSection: 'circulars',
    },
  ]
  const completed = steps.filter((step) => step.complete).length

  return {
    score: Math.round((completed / steps.length) * 100),
    completed,
    total: steps.length,
    steps,
  }
}

export function getInstitutionState(sessionUser = { role: 'admin', actorId: '', name: 'CampusOps' }) {
  const profile = getInstitutionProfile()
  const academic = getAcademicState()
  const circulars = getCirculars()
  const stats = {
    departments: getDepartments().filter((department) => department.status === 'active').length,
    subjects: getSubjects().filter((subject) => subject.status === 'active').length,
    students: academic.students.length,
    staff: getStaffProfiles().filter((staff) => staff.status === 'active').length,
    classSections: academic.classSections.length,
    timetableSlots: academic.slots.length,
    attendanceRecords: academic.attendance.length,
    pendingLeaves: academic.leaves.filter((leave) => leave.status === 'pending').length,
    circulars: circulars.length,
    knowledgeDocuments: getKnowledgeDocuments().filter((document) => document.status === 'active').length,
  }

  let dashboard
  if (sessionUser.role === 'student') {
    const student = academic.students.find((item) => item.id === sessionUser.actorId)
    const attendance = academic.attendance.filter((record) => record.studentId === sessionUser.actorId)
    const attended = attendance.filter((record) => ['present', 'excused'].includes(record.status)).length
    const receipts = new Set(
      getCircularReadReceipts()
        .filter((receipt) => receipt.actorId === sessionUser.actorId)
        .map((receipt) => receipt.circularId),
    )
    const visibleActiveCirculars = circulars.filter(
      (circular) => isCircularActive(circular) && isCircularVisibleForActor(circular, sessionUser, academic),
    )

    dashboard = {
      attendancePercent: attendance.length > 0 ? Math.round((attended / attendance.length) * 100) : null,
      scheduledPeriods: student
        ? academic.slots.filter((slot) => slot.classSectionId === student.classSectionId).length
        : 0,
      pendingLeaves: academic.leaves.filter(
        (leave) => leave.studentId === sessionUser.actorId && leave.status === 'pending',
      ).length,
      unreadCirculars: visibleActiveCirculars.filter((circular) => !receipts.has(circular.id)).length,
      openActions: 0,
      criticalActions: 0,
      attendanceGaps: 0,
    }
  } else {
    const actions = getActionCenter({ role: sessionUser.role, actorId: sessionUser.actorId })
    dashboard = {
      attendancePercent: null,
      scheduledPeriods: sessionUser.role === 'faculty'
        ? academic.slots.filter((slot) => slot.teacherId === sessionUser.actorId).length
        : academic.slots.length,
      pendingLeaves: actions.summary.pendingLeaves,
      unreadCirculars: actions.summary.circularsWithUnread,
      openActions: actions.summary.total,
      criticalActions: actions.summary.critical,
      attendanceGaps: actions.summary.attendanceGaps,
    }
  }

  return {
    version: 1,
    source: 'sqlite',
    profile,
    readiness: getInstitutionReadiness(profile, stats),
    stats,
    dashboard,
  }
}

export function updateInstitutionProfile(input, actor = 'CampusOps Admin') {
  const profile = {
    name: safeString(input?.name).replace(/\s+/g, ' '),
    shortName: safeString(input?.shortName).replace(/\s+/g, ' '),
    code: safeString(input?.code).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12),
    academicYear: safeString(input?.academicYear).replace(/\s+/g, ' '),
    currentTerm: safeString(input?.currentTerm).replace(/\s+/g, ' '),
    timezone: safeString(input?.timezone),
    attendanceThreshold: Number(input?.attendanceThreshold),
    emailDomain: safeString(input?.emailDomain).toLowerCase().replace(/^@/, ''),
    website: safeString(input?.website),
  }

  const errors = []
  if (profile.name.length < 3) errors.push('College name must contain at least 3 characters.')
  if (profile.shortName.length < 2) errors.push('Short name must contain at least 2 characters.')
  if (profile.code.length < 2) errors.push('College code must contain at least 2 letters or numbers.')
  if (!profile.academicYear) errors.push('Academic year is required.')
  if (!profile.currentTerm) errors.push('Current term is required.')
  if (!profile.timezone) errors.push('Timezone is required.')
  if (!Number.isInteger(profile.attendanceThreshold) || profile.attendanceThreshold < 1 || profile.attendanceThreshold > 100) {
    errors.push('Attendance threshold must be a whole number between 1 and 100.')
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(profile.emailDomain)) errors.push('Enter a valid institutional email domain.')
  if (profile.website) {
    try {
      const websiteUrl = new URL(profile.website)
      if (!['http:', 'https:'].includes(websiteUrl.protocol)) errors.push('Website must use http or https.')
    } catch {
      errors.push('Enter a valid website URL.')
    }
  }
  if (errors.length > 0) {
    const error = new Error(errors[0])
    error.validationErrors = errors
    throw error
  }

  db.prepare(`
    UPDATE institution_profile
    SET
      name = ?,
      short_name = ?,
      code = ?,
      academic_year = ?,
      current_term = ?,
      timezone = ?,
      attendance_threshold = ?,
      email_domain = ?,
      website = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 'primary'
  `).run(
    profile.name,
    profile.shortName,
    profile.code,
    profile.academicYear,
    profile.currentTerm,
    profile.timezone,
    profile.attendanceThreshold,
    profile.emailDomain,
    profile.website,
  )

  createAuditEvent({
    actor,
    action: 'Updated college setup',
    outcome: `${profile.name} profile and operating policy settings were saved.`,
    severity: 'success',
  })

  return getInstitutionState({ role: 'admin', actorId: '', name: actor })
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
    knowledgeDocuments: db.prepare('SELECT COUNT(*) AS count FROM knowledge_documents').get().count,
    knowledgeChunks: db.prepare('SELECT COUNT(*) AS count FROM knowledge_chunks').get().count,
    automationRules: db.prepare('SELECT COUNT(*) AS count FROM automation_rules').get().count,
    automationRuns: db.prepare('SELECT COUNT(*) AS count FROM automation_runs').get().count,
    automationNotifications: db.prepare('SELECT COUNT(*) AS count FROM automation_notifications').get().count,
    users: db.prepare('SELECT COUNT(*) AS count FROM auth_users').get().count,
    activeSessions: db.prepare('SELECT COUNT(*) AS count FROM auth_sessions').get().count,
    auditEvents: db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count,
    institutionProfiles: db.prepare('SELECT COUNT(*) AS count FROM institution_profile').get().count,
  }
}
