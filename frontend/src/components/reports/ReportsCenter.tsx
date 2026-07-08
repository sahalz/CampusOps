import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  Database,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { strToU8, zipSync } from 'fflate'
import { jsPDF } from 'jspdf'
import {
  fetchReports,
  recordReportActionOnServer,
  type ReportQuery,
} from '../../lib/api'
import type {
  AttendanceShortageReportRow,
  AuditEvent,
  CircularEngagementReportRow,
  DailyOperationsSummary,
  DepartmentSubjectCoverageReportRow,
  FacultyWorkloadReportRow,
  InactiveMasterDataReportRow,
  PendingLeaveReportRow,
  ReportsPayload,
  Role,
} from '../../types'

type ReportsCenterProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent, persist?: boolean) => void
}

type Column<T> = {
  header: string
  render: (row: T) => ReactNode
  align?: 'right'
}

type CsvRow = Record<string, string | number | boolean | null | undefined>

type ExportFormat = 'csv' | 'xlsx' | 'pdf'

const emptyReports: ReportsPayload = {
  version: 1,
  source: 'sqlite',
  generatedAt: '',
  filters: {
    department: 'all',
    semester: 'all',
    date: '',
    status: 'all',
    role: 'admin',
    actorId: '',
  },
  filterOptions: {
    departments: [],
    semesters: [],
    dates: [],
    statuses: ['all'],
  },
  kpis: {
    attendanceShortage: 0,
    pendingLeaves: 0,
    overloadedFaculty: 0,
    unmappedCoverageRows: 0,
    inactiveRecords: 0,
    unreadCirculars: 0,
    markedAttendanceToday: 0,
  },
  attendanceShortage: [],
  pendingLeave: [],
  facultyWorkload: [],
  departmentSubjectCoverage: [],
  inactiveMasterData: [],
  circularEngagement: [],
  dailySummary: {
    date: '',
    markedAttendanceCount: 0,
    presentCount: 0,
    absentCount: 0,
    pendingLeaveAttendanceCount: 0,
    pendingLeaveRequests: 0,
    activeCirculars: 0,
    unreadCircularReceipts: 0,
    activeDepartments: 0,
    activeSubjects: 0,
  },
}

function makeAudit(actor: string, action: string, outcome: string, severity: AuditEvent['severity']): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor,
    action,
    outcome,
    severity,
  }
}

function statusLabel(status: string) {
  if (status === 'all') {
    return 'All status'
  }

  return status
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function searchRows<T extends object>(rows: T[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return rows
  }

  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery)),
  )
}

function quoteCsv(value: string | number | boolean | null | undefined) {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) {
    return text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: CsvRow[]) {
  if (rows.length === 0) {
    return
  }

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function xmlEscape(value: string | number | boolean | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index: number) {
  let name = ''
  let current = index + 1
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function worksheetXml(rows: CsvRow[]) {
  const headers = Object.keys(rows[0] ?? {})
  const rowXml = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ]
    .map((cells, rowIndex) => {
      const cellXml = cells
        .map((value, columnIndex) => {
          const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${cellRef}"><v>${value}</v></c>`
          }

          return `<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${rowIndex + 1}">${cellXml}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <sheetData>${rowXml}</sheetData>
</worksheet>`
}

function downloadXlsx(filename: string, rows: CsvRow[]) {
  if (rows.length === 0) {
    return
  }

  const workbookFiles = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Report" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(worksheetXml(rows)),
  }

  const blob = new Blob([zipSync(workbookFiles)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatPdfCell(value: string | number | boolean | null | undefined) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function downloadPdf(filename: string, title: string, rows: CsvRow[]) {
  if (rows.length === 0) {
    return
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const headers = Object.keys(rows[0])
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const usableWidth = pageWidth - margin * 2
  const columnWidth = usableWidth / headers.length
  let y = 42

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(title, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`CampusOps AI / Generated ${new Date().toLocaleString()}`, margin, y + 15)
    y += 38
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y - 13, usableWidth, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    headers.forEach((header, index) => {
      doc.text(header.slice(0, 24), margin + index * columnWidth + 4, y)
    })
    y += 18
  }

  drawHeader()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  rows.forEach((row) => {
    if (y > pageHeight - 34) {
      doc.addPage()
      y = 42
      drawHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
    }

    headers.forEach((header, index) => {
      const text = formatPdfCell(row[header])
      const lines = doc.splitTextToSize(text || '-', Math.max(columnWidth - 8, 32)).slice(0, 2)
      doc.text(lines, margin + index * columnWidth + 4, y)
    })
    y += 24
  })

  doc.save(filename)
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

function percent(value: number) {
  return `${value}%`
}

function ReportTable<T extends object>({
  title,
  kicker,
  icon: Icon,
  rows,
  columns,
  emptyMessage,
  onExport,
}: {
  title: string
  kicker: string
  icon: LucideIcon
  rows: T[]
  columns: Column<T>[]
  emptyMessage: string
  onExport: (format: ExportFormat) => void
}) {
  return (
    <section className="panel report-panel">
      <div className="panel-heading report-panel-heading">
        <div>
          <span className="panel-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        <div className="report-panel-actions">
          <button type="button" className="secondary-action" disabled={rows.length === 0} onClick={() => onExport('csv')}>
            <Download size={15} />
            <span>CSV</span>
          </button>
          <button type="button" className="secondary-action" disabled={rows.length === 0} onClick={() => onExport('xlsx')}>
            <FileSpreadsheet size={15} />
            <span>XLSX</span>
          </button>
          <button type="button" className="secondary-action" disabled={rows.length === 0} onClick={() => onExport('pdf')}>
            <FileText size={15} />
            <span>PDF</span>
          </button>
          <Icon size={20} />
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.header} className={clsx(column.align === 'right' && 'is-right')}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.header} className={clsx(column.align === 'right' && 'is-right')}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state empty-state--boxed">
          <Search size={18} />
          <span>{emptyMessage}</span>
        </div>
      )}
    </section>
  )
}

function summaryToRows(summary: DailyOperationsSummary): CsvRow[] {
  return [
    {
      date: summary.date,
      markedAttendance: summary.markedAttendanceCount,
      present: summary.presentCount,
      absent: summary.absentCount,
      pendingAttendance: summary.pendingLeaveAttendanceCount,
      pendingLeaveRequests: summary.pendingLeaveRequests,
      activeCirculars: summary.activeCirculars,
      unreadCircularReceipts: summary.unreadCircularReceipts,
      activeDepartments: summary.activeDepartments,
      activeSubjects: summary.activeSubjects,
    },
  ]
}

export function ReportsCenter({ currentRole, actorId, userName, onAuditEvent }: ReportsCenterProps) {
  const [reports, setReports] = useState<ReportsPayload>(emptyReports)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Checking local backend.')
  const [refreshToken, setRefreshToken] = useState(0)
  const isAdmin = currentRole === 'admin'

  const reportQuery = useMemo<ReportQuery>(
    () => ({
      department: departmentFilter,
      semester: semesterFilter,
      date: dateFilter,
      status: statusFilter,
      role: currentRole,
      actorId,
    }),
    [actorId, currentRole, dateFilter, departmentFilter, semesterFilter, statusFilter],
  )

  useEffect(() => {
    let mounted = true
    setBackendStatus((currentStatus) => (currentStatus === 'offline' ? 'offline' : 'checking'))

    fetchReports(reportQuery)
      .then((payload) => {
        if (!mounted) {
          return
        }

        setReports(payload)
        setBackendStatus('connected')
        setSyncMessage('SQLite backend connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setBackendStatus('offline')
        setSyncMessage('Reports backend unavailable.')
      })

    return () => {
      mounted = false
    }
  }, [refreshToken, reportQuery])

  const auditReportAction = async (action: string, reportName: string, outcome: string) => {
    if (backendStatus === 'connected') {
      try {
        const auditEvent = await recordReportActionOnServer({
          actor: userName,
          action,
          reportName,
          outcome,
        })
        onAuditEvent(auditEvent, false)
        return
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Report action audit saved in browser backup.')
      }
    }

    onAuditEvent(makeAudit(userName, action, outcome, 'info'))
  }

  const exportRows = (reportName: string, rows: CsvRow[], format: ExportFormat) => {
    if (rows.length === 0) {
      return
    }

    const filenameBase = `campusops-${reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dateStamp()}`
    if (format === 'csv') {
      downloadCsv(`${filenameBase}.csv`, rows)
    } else if (format === 'xlsx') {
      downloadXlsx(`${filenameBase}.xlsx`, rows)
    } else {
      downloadPdf(`${filenameBase}.pdf`, reportName, rows)
    }

    void auditReportAction('Exported report', reportName, `${reportName} exported as ${format.toUpperCase()}.`)
  }

  const refreshReports = () => {
    setRefreshToken((currentToken) => currentToken + 1)
    void auditReportAction('Refreshed reports', 'Reports center', 'Reports center refreshed by user.')
  }

  const printReports = () => {
    void auditReportAction('Printed reports', 'Reports center', 'Reports center sent to browser print.')
    window.print()
  }

  const visibleAttendance = searchRows(reports.attendanceShortage, query)
  const visibleLeaves = searchRows(reports.pendingLeave, query)
  const visibleWorkload = searchRows(reports.facultyWorkload, query)
  const visibleCoverage = searchRows(reports.departmentSubjectCoverage, query)
  const visibleInactive = searchRows(reports.inactiveMasterData, query)
  const visibleCirculars = searchRows(reports.circularEngagement, query)
  const visibleSummary = searchRows([reports.dailySummary], query)

  const kpiCards = [
    {
      label: 'Attendance shortage',
      value: reports.kpis.attendanceShortage,
      detail: 'students below 75%',
      icon: AlertTriangle,
      tone: 'amber',
    },
    {
      label: 'Pending leave',
      value: reports.kpis.pendingLeaves,
      detail: isAdmin ? 'needs action' : 'assigned to me',
      icon: CalendarClock,
      tone: 'blue',
    },
    {
      label: 'High workload',
      value: reports.kpis.overloadedFaculty,
      detail: 'faculty above threshold',
      icon: UsersRound,
      tone: 'green',
    },
    {
      label: 'Unread circulars',
      value: reports.kpis.unreadCirculars,
      detail: 'targeted unread count',
      icon: BellRing,
      tone: 'slate',
    },
  ]

  if (currentRole === 'student') {
    return null
  }

  return (
    <section className={clsx('reports-center', !isAdmin && 'reports-center--faculty')}>
      <div className="reports-header">
        <div>
          <span className="eyebrow">{isAdmin ? 'Reports' : 'My reports'}</span>
          <h2>{isAdmin ? 'College admin reports and export center' : 'My operational reports'}</h2>
          <p>
            Daily decision reports for attendance shortage, leave action, teaching load, subject coverage,
            circular engagement, and master-data hygiene.
          </p>
          <div className={clsx('master-sync-chip', `is-${backendStatus}`)}>
            <span>{backendStatus === 'connected' ? 'SQLite backend' : backendStatus === 'checking' ? 'Checking backend' : 'Browser backup'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="reports-health">
          <strong>{reports.dailySummary.markedAttendanceCount}</strong>
          <span>marked attendance on {reports.dailySummary.date || 'selected day'}</span>
        </div>
      </div>

      <div className="reports-toolbar">
        <label className="reports-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reports"
            aria-label="Search reports"
          />
        </label>
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="all">All departments</option>
          {reports.filterOptions.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
          <option value="all">All semesters</option>
          {reports.filterOptions.semesters.map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          aria-label="Filter reports by date"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {reports.filterOptions.statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-action" onClick={refreshReports}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
        <button type="button" className="secondary-action" onClick={printReports}>
          <Printer size={15} />
          <span>Print</span>
        </button>
      </div>

      <div className="reports-kpis">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className={clsx('report-kpi', `tone-${card.tone}`)}>
              <Icon size={18} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </article>
          )
        })}
      </div>

      <div className="reports-grid">
        {isAdmin ? (
          <ReportTable<AttendanceShortageReportRow>
            title="Attendance shortage"
            kicker={`${visibleAttendance.length} students below 75%`}
            icon={AlertTriangle}
            rows={visibleAttendance}
            emptyMessage="No students match the shortage filters."
            onExport={(format) => exportRows('Attendance shortage', visibleAttendance, format)}
            columns={[
              {
                header: 'Student',
                render: (row) => (
                  <span>
                    <strong>{row.rollNo}</strong>
                    <small>{row.studentName}</small>
                  </span>
                ),
              },
              { header: 'Class', render: (row) => `${row.className} / Sem ${row.semester}` },
              { header: 'Department', render: (row) => row.department },
              { header: 'Attendance', align: 'right', render: (row) => percent(row.attendancePercent) },
              { header: 'Missed', align: 'right', render: (row) => row.missed },
              { header: 'Last marked', render: (row) => row.lastMarkedDate },
            ]}
          />
        ) : null}

        <ReportTable<PendingLeaveReportRow>
          title={isAdmin ? 'Pending leave action' : 'My leave review queue'}
          kicker={`${visibleLeaves.length} requests`}
          icon={CalendarClock}
          rows={visibleLeaves}
          emptyMessage="No leave requests match the current filters."
          onExport={(format) => exportRows('Pending leave', visibleLeaves, format)}
          columns={[
            {
              header: 'Request',
              render: (row) => (
                <span>
                  <strong>{row.id}</strong>
                  <small>{row.date} / P{row.periodNumber}</small>
                </span>
              ),
            },
            {
              header: 'Student',
              render: (row) => (
                <span>
                  <strong>{row.rollNo}</strong>
                  <small>{row.studentName}</small>
                </span>
              ),
            },
            { header: 'Subject', render: (row) => row.subjectName },
            { header: 'Reviewer', render: (row) => row.reviewerName },
            { header: 'Status', render: (row) => <span className="status-chip">{row.status}</span> },
          ]}
        />

        <ReportTable<FacultyWorkloadReportRow>
          title={isAdmin ? 'Faculty workload' : 'My timetable workload'}
          kicker={`${visibleWorkload.length} faculty rows`}
          icon={UsersRound}
          rows={visibleWorkload}
          emptyMessage="No faculty workload rows match the current filters."
          onExport={(format) => exportRows('Faculty workload', visibleWorkload, format)}
          columns={[
            {
              header: 'Faculty',
              render: (row) => (
                <span>
                  <strong>{row.teacherName}</strong>
                  <small>{row.employeeCode} / {row.designation}</small>
                </span>
              ),
            },
            { header: 'Department', render: (row) => row.department },
            { header: 'Slots', align: 'right', render: (row) => row.assignedSlots },
            { header: 'Subjects', align: 'right', render: (row) => row.uniqueSubjects },
            { header: 'Classes', align: 'right', render: (row) => row.classSections },
            { header: 'Load', render: (row) => <span className={clsx('status-chip', row.loadStatus === 'overloaded' && 'status-chip--warning')}>{row.loadStatus}</span> },
          ]}
        />

        {isAdmin ? (
          <>
            <ReportTable<DepartmentSubjectCoverageReportRow>
              title="Department subject coverage"
              kicker={`${visibleCoverage.length} department semester rows`}
              icon={BookOpenCheck}
              rows={visibleCoverage}
              emptyMessage="No coverage rows match the current filters."
              onExport={(format) => exportRows('Subject coverage', visibleCoverage, format)}
              columns={[
                {
                  header: 'Department',
                  render: (row) => (
                    <span>
                      <strong>{row.departmentCode}</strong>
                      <small>{row.departmentName}</small>
                    </span>
                  ),
                },
                { header: 'Sem', align: 'right', render: (row) => row.semester },
                { header: 'Coverage', align: 'right', render: (row) => percent(row.coveragePercent) },
                { header: 'Mapped', align: 'right', render: (row) => `${row.mappedSubjects}/${row.totalSubjects}` },
                { header: 'Unmapped', render: (row) => row.unmappedSubjectCodes || 'None' },
              ]}
            />

            <ReportTable<InactiveMasterDataReportRow>
              title="Inactive departments and subjects"
              kicker={`${visibleInactive.length} inactive records`}
              icon={Filter}
              rows={visibleInactive}
              emptyMessage="No inactive departments or subjects match the current filters."
              onExport={(format) => exportRows('Inactive master data', visibleInactive, format)}
              columns={[
                { header: 'Type', render: (row) => row.type },
                {
                  header: 'Record',
                  render: (row) => (
                    <span>
                      <strong>{row.code}</strong>
                      <small>{row.name}</small>
                    </span>
                  ),
                },
                { header: 'Owner', render: (row) => row.owner },
                { header: 'Detail', render: (row) => row.detail },
                { header: 'Status', render: (row) => <span className="status-chip">{row.status}</span> },
              ]}
            />

            <ReportTable<CircularEngagementReportRow>
              title="Circular engagement"
              kicker={`${visibleCirculars.length} circular rows`}
              icon={BellRing}
              rows={visibleCirculars}
              emptyMessage="No circular engagement rows match the current filters."
              onExport={(format) => exportRows('Circular engagement', visibleCirculars, format)}
              columns={[
                {
                  header: 'Circular',
                  render: (row) => (
                    <span>
                      <strong>{row.id}</strong>
                      <small>{row.title}</small>
                    </span>
                  ),
                },
                { header: 'Audience', render: (row) => row.audience },
                { header: 'Read rate', align: 'right', render: (row) => percent(row.readRate) },
                { header: 'Read', align: 'right', render: (row) => `${row.readCount}/${row.targetCount}` },
                { header: 'Unread', align: 'right', render: (row) => row.unreadCount },
                { header: 'Status', render: (row) => <span className="status-chip">{row.active ? row.status : 'expired'}</span> },
              ]}
            />
          </>
        ) : null}

        <ReportTable<DailyOperationsSummary>
          title="Daily operations summary"
          kicker={reports.dailySummary.date || 'latest operational date'}
          icon={Database}
          rows={visibleSummary}
          emptyMessage="No daily summary matches the current search."
          onExport={(format) => exportRows('Daily operations summary', summaryToRows(reports.dailySummary), format)}
          columns={[
            { header: 'Date', render: (row) => row.date },
            { header: 'Marked', align: 'right', render: (row) => row.markedAttendanceCount },
            { header: 'Present', align: 'right', render: (row) => row.presentCount },
            { header: 'Absent', align: 'right', render: (row) => row.absentCount },
            { header: 'Pending attendance', align: 'right', render: (row) => row.pendingLeaveAttendanceCount },
            { header: 'Pending leave', align: 'right', render: (row) => row.pendingLeaveRequests },
            { header: 'Active circulars', align: 'right', render: (row) => row.activeCirculars },
          ]}
        />
      </div>
    </section>
  )
}
