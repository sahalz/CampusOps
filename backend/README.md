# CampusOps Backend

Local Node.js API for CampusOps AI.

The backend uses Node's built-in SQLite support and stores data in:

```txt
backend/data/campusops.sqlite
```

Run from the project root:

```bash
npm run dev
```

Run only the backend:

```bash
npm --prefix backend run dev
```

Health check:

```bash
curl http://127.0.0.1:4174/api/health
```

Key persisted APIs:

- `GET /api/academic-state`
- `PUT /api/academic-state`
- `POST /api/academic-state/reset`
- `GET /api/master-data`
- `GET /api/audit-events`
