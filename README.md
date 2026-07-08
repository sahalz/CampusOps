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
- SQLite-backed academic operations: classes, teachers, students, subjects, timetable, attendance, leave requests, approvals
- Departments and subjects master data with SQLite-backed persistence
- Staff register, admin circulars, and circular read receipts with SQLite-backed persistence
- Admin Reports and Export Center for attendance shortage, pending leave, workload, subject coverage, inactive records, circular engagement, and daily operations
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
- Academic operations, master data, staff profiles, circulars, read receipts, reports, and audit logs are persisted outside the browser.
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

Open Reports after Master Data to show CSV export, print-friendly reporting, and the SQLite sync status. Then switch to Faculty and Student to show role-specific views.
