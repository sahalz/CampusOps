# CampusOps AI

Secure Multi-Agent Workflow Automation Platform for College Operations.

CampusOps AI is now structured as a clean full-stack final-year project:

```txt
CampusOps/
  frontend/   Vite React + TypeScript college operations UI
  backend/    Node.js HTTP API + local SQLite database
  docs/       Architecture, project structure, and demo guide
  scripts/    Developer scripts for running the full stack
```

## What Works

- Role-based Admin, Faculty, and Student workspaces
- SQLite-backed demo users, login sessions, and backend role checks for protected admin/faculty APIs
- Action Center for daily admin/faculty priorities across attendance, leave, workload, circulars, timetable mapping, and master data
- SQLite-backed academic operations: classes, teachers, students, subjects, timetable, attendance, leave requests, approvals
- Departments and subjects master data with SQLite-backed persistence
- Staff register, admin circulars, and circular read receipts with SQLite-backed persistence
- Campus Notice Intelligence for circular Q&A, deadlines, unread counts, and source citations
- Admin Import Center for CSV/XLSX students, staff, subjects, and timetable uploads with preview validation
- Admin Reports and Export Center for attendance shortage, pending leave, workload, subject coverage, inactive records, circular engagement, and daily operations
- Rejected import rows can be exported as CSV or XLSX for office correction
- Report exports in CSV, PDF, and XLSX formats with audit events
- Policy Knowledge and RAG Center with SQLite-backed documents, chunks, search, and citations
- Audit trail persistence through the backend
- Local AI routing simulator with guardrails and workflow visualization
- Free/local-first deployment model with no paid APIs required

## Run The Full Stack

From the project root:

```bash
npm run dev
```

This starts:

- Frontend: `http://127.0.0.1:5173/`
- Backend API: `http://127.0.0.1:4174/`
- SQLite database: `backend/data/campusops.sqlite`

Health check:

```bash
curl http://127.0.0.1:5173/api/health
```

## Verify

```bash
npm run build
npm run lint
```

## Why This Architecture

The project is designed for a reliable college presentation and a realistic adoption path:

- The frontend is professional, responsive, and role-aware.
- The backend uses local SQLite, so the demo works without internet or paid services.
- Users, sessions, academic operations, master data, staff profiles, circulars, read receipts, knowledge documents, action-center events, reports, and audit logs are persisted outside the browser.
- Admin imports validate and commit accepted rows through SQLite-backed APIs before changing operational data.
- Policy search is grounded in SQLite-backed chunks with source citations for office use.
- Browser localStorage remains as a fallback so the demo can continue if the backend is temporarily offline.
- The structure can later evolve to PostgreSQL/Supabase without rewriting the UI.

## Documentation

- [Project structure](docs/project-structure.md)
- [Architecture](docs/architecture.md)
- [Demo script](docs/demo-script.md)

## Recommended Demo Login

Use the Admin account first:

- `Dr. Priya Menon`
- Role: Admin

Open Action Center first to show the daily admin inbox, then open Knowledge to ask an attendance or leave policy question and show citations. Open Imports after Master Data to show CSV/XLSX templates, preview validation, rejected-row exports, and SQLite commit. Finish with Reports to show CSV, PDF, and XLSX export, print-friendly reporting, and the SQLite sync status.
