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
- Role-aware Campus Home with personal metrics, priority shortcuts, and college operating context
- Persistent College Setup for institution identity, academic year, term, timezone, email domain, and attendance shortage threshold
- Database-backed rollout readiness checklist that guides a college from setup through master data, people, timetable, policies, and communication
- SQLite-backed demo users, login sessions, and backend role checks for protected admin/faculty APIs
- Action Center for daily admin/faculty priorities across attendance, leave, workload, circulars, timetable mapping, and master data
- SQLite-backed Automation Control with live triggers, cooldown-based duplicate suppression, human approval gates, retries, scheduled checks, and an in-app notification outbox
- SQLite-backed academic operations: classes, teachers, students, subjects, timetable, attendance, leave requests, approvals
- Departments and subjects master data with SQLite-backed persistence
- Staff register, admin circulars, and circular read receipts with SQLite-backed persistence
- Campus Notice Intelligence for circular Q&A, deadlines, unread counts, and source citations
- Simple three-step Upload Data flow for PDF, CSV, and XLSX student, staff, subject, and timetable lists
- Automatic PDF table detection, editable column mapping, list-type recognition, and backend validation before saving
- Inline correction for rejected rows, plus teacher, room, class, time-overlap, and duplicate timetable conflict checks
- Admin Reports and Export Center for attendance shortage, pending leave, workload, subject coverage, inactive records, circular engagement, and daily operations
- Uncertain or rejected import rows stay separate and can be exported as XLSX for office correction
- Report exports in CSV, PDF, and XLSX formats with audit events
- Hybrid Policy RAG with direct text-based PDF ingestion, SQLite FTS5 ranking, related-concept matching, role-aware visibility, policy lifecycle metadata, and page-level citations
- Admin RAG evaluation dashboard measuring retrieval accuracy, citation correctness, and answer support against an approved question set
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
npm test
npm run build
npm run lint
```

## Why This Architecture

The project is designed for a reliable college presentation and a realistic adoption path:

- The frontend is professional, responsive, and role-aware.
- The backend uses local SQLite, so the demo works without internet or paid services.
- Users, sessions, academic operations, master data, staff profiles, circulars, read receipts, knowledge documents, automation rules/runs/notifications, action-center events, reports, and audit logs are persisted outside the browser.
- Admin imports validate and commit accepted rows through SQLite-backed APIs before changing operational data.
- Policy search is grounded in SQLite-backed chunks with source citations for office use.
- Browser localStorage remains as a fallback so the demo can continue if the backend is temporarily offline.
- The structure can later evolve to PostgreSQL/Supabase without rewriting the UI.

## Documentation

- [Project structure](docs/project-structure.md)
- [Architecture](docs/architecture.md)
- [Demo script](docs/demo-script.md)
- [College adoption guide](docs/college-adoption-guide.md)

## Recommended Demo Login

Use the Admin account first:

- `Dr. Priya Menon`
- Role: Admin

Open Home first to show the college operating picture and rollout readiness. Continue into College Setup to replace the demonstration identity and confirm the attendance shortage threshold. Then open Action Center, Automation, Knowledge, Imports, and Reports to demonstrate the daily operating flow.
