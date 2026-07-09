# Demo Script

## 1. Start The System

```bash
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/
```

Mention that the backend runs locally with SQLite at:

```txt
http://127.0.0.1:4174/
```

## 2. Admin Login

Choose:

```txt
Dr. Priya Menon / Academic Admin
```

Show:

- Login identity chip: `SQLite identity`
- Action Center as the first admin workspace
- Academic sync chip: `SQLite backend`
- Academic operations dashboard
- Timetable mapping
- Attendance and leave flow
- Master Data section
- Knowledge section
- Imports section
- Reports section

## 3. Action Center Demo

In Action Center:

1. Show the sync chip: `SQLite backend connected`.
2. Point out open actions, critical items, pending leave, and attendance gaps.
3. Search for `Rahul` to show leave and attendance follow-up work.
4. Open an action to jump into the related module.
5. Mark an action reviewed and show that the audit trail records the action.

## 4. Master Data Demo

In Master Data:

1. Show the sync chip: `SQLite backend`.
2. Search for `Computer Science`.
3. Edit the department office room or HOD.
4. Add a new subject.
5. Try a duplicate subject code to show validation.
6. Show that audit events are recorded.

## 5. Knowledge RAG Demo

In Knowledge:

1. Show the sync chip: `SQLite RAG knowledge base connected`.
2. Ask: `What is the minimum attendance requirement?`
3. Show the grounded answer and citations from the Academic Handbook.
4. Ask: `Who approves medical leave for a period?`
5. As Admin, paste or load a plain text policy document and save it.
6. Search a tag such as `circular` or `placement` to show source-backed retrieval.

## 6. Circular Intelligence Demo

In Circulars:

1. Ask `urgent notices` to show circular Q&A with citations.
2. Ask `deadlines this week` to show expiry/deadline chips.
3. Ask `placement orientation` as the student account to show role-visible notice answers.
4. Mark a notice read and show unread counts update.
5. Publish a new circular as Admin and search for a term from the message.

## 7. Import Center Demo

In Imports:

1. Show the sync chip for SQLite import validation.
2. Choose `Students`, then download the blank CSV and XLSX templates.
3. Upload a CSV or XLSX file and show preview KPIs for accepted, rejected, creates, and updates.
4. Search preview rows to find a roll number, department, or validation issue.
5. Export rejected rows as CSV or XLSX for office correction.
6. Import valid rows and show that the backend records an audit event.

## 8. Reports Demo

In Reports:

1. Show the sync chip: `SQLite backend connected`.
2. Point out KPI cards for attendance shortage, pending leave, workload, and circular unread counts.
3. Filter by `Computer Science` and `Semester 5`.
4. Search for `Rahul` to show the attendance shortage and pending leave rows.
5. Open the subject coverage report and point out unmapped subjects.
6. Export one report as CSV, PDF, and XLSX and show that audit events are recorded.
7. Use Print to show the office-friendly print layout.

## 9. Academic Workflow Demo

1. Map a timetable period.
2. Select a timetable slot.
3. Mark attendance.
4. Submit a period-wise leave request.
5. Approve or reject the leave.

## 10. Faculty Login

Logout and choose:

```txt
Prof. Anjali Rao / Faculty
```

Show:

- Faculty-only academic workspace
- My Actions view with assigned leave, workload, and attendance marking gaps
- Assigned periods
- Leave approval queue
- Circular intelligence limited to faculty-visible notices
- Knowledge search with citations for policy questions
- Read-only Master Data view for department and assigned subjects
- Limited My Reports view for assigned leave and workload backed by backend RBAC

## 11. Student Login

Logout and choose:

```txt
Aisha Khan / Student
```

Show:

- Student timetable
- Attendance health
- Period-wise leave application
- Circular intelligence limited to student-visible notices
- Knowledge search for student policy questions
- No admin Imports, Master Data, Action Center, or Reports code loaded in the sidebar

## Closing Line

Use this explanation:

> CampusOps AI is a full-stack local prototype. The frontend delivers role-specific college operations workflows, while the backend provides SQLite persistence for users, sessions, academics, imports, knowledge documents, master data, staff, circulars, action-center events, reports, and audit logs. It works without paid services and can be upgraded to a campus-wide deployment with password or SSO authentication and PostgreSQL.
