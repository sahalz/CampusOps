# College Adoption Guide

CampusOps AI is designed for a department or small-college pilot before a campus-wide rollout. The safest path is to configure the institution, load controlled data, validate one academic workflow, and expand only after the pilot team accepts the results.

## 1. Name the Pilot Owner

Assign one academic administrator as the CampusOps owner and one faculty representative from the pilot department. The owner is responsible for data quality, policy sources, access review, and go-live decisions.

Recommended first scope:

- One department
- One active semester
- Two class sections
- A small faculty group
- Attendance, period-wise leave, circulars, and weekly shortage reporting

## 2. Configure College Setup

Open `College Setup` as an administrator and replace the demonstration values:

- Official and short college names
- Institution code
- Academic year and current term
- Local timezone
- Attendance shortage alert threshold
- Institutional email domain and website

Saving the profile updates shared branding, home context, reports, Action Center escalation, and the audit trail.

## 3. Prepare Foundation Data

Follow the readiness checklist in order:

1. Create departments and subject catalogs in Master Data.
2. Upload text-based PDF, CSV, or XLSX student and staff lists. PDF tables are mapped automatically when they contain recognizable headers.
3. Upload a long-form timetable PDF or spreadsheet containing class section, day, period, time, subject, faculty, and room columns.
4. Add approved policies to Knowledge with a clear source and owner.
5. Publish a test circular to the smallest correct audience.

Use import preview validation before every commit. Export rejected rows, correct them outside the system, and re-upload them rather than accepting partial or ambiguous data.

Scanned image-only PDFs require OCR before upload. CampusOps deliberately keeps missing or uncertain fields in `Needs correction` instead of inventing official student or timetable data.

## 4. Run a Two-Week Operational Pilot

During the pilot:

- Faculty mark attendance against mapped periods on the same day.
- Students submit leave against the exact date and period.
- Faculty review assigned leave decisions.
- Administrators start each day in Home, then work through Action Center.
- The academic office exports the shortage and pending-leave reports weekly.
- The pilot owner checks audit events and unresolved data-quality actions.

Success criteria should include register completion, leave turnaround time, report accuracy, circular read rates, and user feedback from all three roles.

## 5. Production Hardening Before Campus-Wide Use

The current repository is a strong local pilot, but a production rollout should add:

- Password authentication or institutional SSO with account provisioning and session expiry
- Narrow endpoint permissions for individual attendance, timetable, and leave mutations
- PostgreSQL or another managed multi-user database
- Automated encrypted backups and tested restore procedures
- HTTPS, secret management, centralized logs, monitoring, and alerting
- Data retention rules, privacy review, and documented administrator responsibilities
- Staging, acceptance testing, release management, and a support owner

Do not treat the seeded users or demonstration data as production identity or official academic records.

## 6. Rollout Sequence

After the pilot succeeds, expand one department or academic workflow at a time. Re-run import validation, policy review, role testing, and report reconciliation for every new scope. Keep the rollout readiness checklist complete and use the audit trail to confirm material setup changes.
