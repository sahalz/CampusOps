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

- Academic sync chip: `SQLite backend`
- Academic operations dashboard
- Timetable mapping
- Attendance and leave flow
- Master Data section
- Reports section

## 3. Master Data Demo

In Master Data:

1. Show the sync chip: `SQLite backend`.
2. Search for `Computer Science`.
3. Edit the department office room or HOD.
4. Add a new subject.
5. Try a duplicate subject code to show validation.
6. Show that audit events are recorded.

## 4. Reports Demo

In Reports:

1. Show the sync chip: `SQLite backend connected`.
2. Point out KPI cards for attendance shortage, pending leave, workload, and circular unread counts.
3. Filter by `Computer Science` and `Semester 5`.
4. Search for `Rahul` to show the attendance shortage and pending leave rows.
5. Open the subject coverage report and point out unmapped subjects.
6. Export one report as CSV and show that an audit event is recorded.
7. Use Print to show the office-friendly print layout.

## 5. Academic Workflow Demo

1. Map a timetable period.
2. Select a timetable slot.
3. Mark attendance.
4. Submit a period-wise leave request.
5. Approve or reject the leave.

## 6. Faculty Login

Logout and choose:

```txt
Prof. Anjali Rao / Faculty
```

Show:

- Faculty-only academic workspace
- Assigned periods
- Leave approval queue
- Read-only Master Data view for department and assigned subjects
- Limited My Reports view for assigned leave and workload

## 7. Student Login

Logout and choose:

```txt
Aisha Khan / Student
```

Show:

- Student timetable
- Attendance health
- Period-wise leave application
- No admin Master Data or Reports code loaded in the sidebar

## Closing Line

Use this explanation:

> CampusOps AI is a full-stack local prototype. The frontend delivers role-specific college operations workflows, while the backend provides SQLite persistence for academics, master data, staff, circulars, reports, and audit logs. It works without paid services and can be upgraded to a campus-wide deployment with real authentication and PostgreSQL.
