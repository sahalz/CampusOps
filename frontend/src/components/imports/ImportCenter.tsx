import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { commitImportOnServer, previewImportOnServer } from '../../lib/api'
import type {
  AuditEvent,
  ImportCellValue,
  ImportKind,
  ImportPreviewPayload,
  ImportPreviewRow,
  ImportSourceRow,
  Role,
} from '../../types'

type ImportCenterProps = {
  currentRole: Role
  userName: string
  onAuditEvent: (event: AuditEvent, persist?: boolean) => void
}

type ImportTemplate = {
  kind: ImportKind
  label: string
  description: string
  columns: string[]
}

type ExportFormat = 'csv' | 'xlsx'

const templates: ImportTemplate[] = [
  {
    kind: 'students',
    label: 'Students',
    description: 'Roll numbers, class sections, and student email records.',
    columns: ['Roll No', 'Name', 'Class Section', 'Email'],
  },
  {
    kind: 'staff',
    label: 'Staff',
    description: 'Faculty profiles linked to teacher workload and contact data.',
    columns: ['Employee Code', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Status', 'Joined At', 'Office Room'],
  },
  {
    kind: 'subjects',
    label: 'Subjects',
    description: 'Department subject catalogue with semester, credits, and faculty owner.',
    columns: ['Department Code', 'Semester', 'Code', 'Name', 'Credits', 'Kind', 'Default Faculty', 'Status'],
  },
  {
    kind: 'timetable',
    label: 'Timetable',
    description: 'Class-period mapping for subject, teacher, room, and timing.',
    columns: ['Class Section', 'Day', 'Period Number', 'Start Time', 'End Time', 'Subject Code', 'Teacher Email', 'Room'],
  },
]

const templateMap = new Map(templates.map((template) => [template.kind, template]))

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

function quoteCsv(value: ImportCellValue) {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) {
    return text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(filename: string, headers: string[], rows: ImportSourceRow[] = []) {
  const csv = [
    headers.map(quoteCsv).join(','),
    ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
  ].join('\n')
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}

function xmlEscape(value: ImportCellValue) {
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

function columnIndex(cellRef: string) {
  const letters = cellRef.match(/[A-Z]+/i)?.[0] ?? 'A'
  return letters
    .toUpperCase()
    .split('')
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1
}

function worksheetXml(headers: string[], rows: ImportSourceRow[]) {
  const rowValues = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ]
  const rowXml = rowValues
    .map((cells, rowIndex) => {
      const cellXml = cells
        .map((value, cellIndex) => {
          const cellRef = `${columnName(cellIndex)}${rowIndex + 1}`
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

function downloadXlsx(filename: string, sheetName: string, headers: string[], rows: ImportSourceRow[] = []) {
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
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(worksheetXml(headers, rows)),
  }

  downloadBlob(
    filename,
    new Blob([zipSync(workbookFiles)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
}

function parseCsvRecords(text: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"' && quoted && nextCharacter === '"') {
      currentCell += '"'
      index += 1
      continue
    }

    if (character === '"') {
      quoted = !quoted
      continue
    }

    if (character === ',' && !quoted) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      currentRow.push(currentCell.trim())
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += character
  }

  currentRow.push(currentCell.trim())
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow)
  }

  return rows
}

function rowsToObjects(rows: string[][]) {
  const headers = rows[0]?.map((header) => header.trim()) ?? []
  return rows
    .slice(1)
    .map((cells) =>
      headers.reduce<ImportSourceRow>((row, header, index) => {
        if (header) {
          row[header] = cells[index] ?? ''
        }
        return row
      }, {}),
    )
    .filter((row) => Object.values(row).some((value) => String(value ?? '').trim().length > 0))
}

function parseCsv(text: string) {
  return rowsToObjects(parseCsvRecords(text))
}

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, 'application/xml')
}

function readCellValue(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute('t')
  if (type === 'inlineStr') {
    return Array.from(cell.getElementsByTagName('t'))
      .map((node) => node.textContent ?? '')
      .join('')
  }

  const rawValue = cell.getElementsByTagName('v')[0]?.textContent ?? ''
  if (type === 's') {
    return sharedStrings[Number(rawValue)] ?? ''
  }

  return rawValue
}

function parseXlsx(buffer: ArrayBuffer) {
  const files = unzipSync(new Uint8Array(buffer))
  const sheetPath = Object.keys(files).find((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
  if (!sheetPath) {
    throw new Error('XLSX file does not include a worksheet.')
  }

  const sharedStringXml = files['xl/sharedStrings.xml'] ? strFromU8(files['xl/sharedStrings.xml']) : ''
  const sharedStrings = sharedStringXml
    ? Array.from(parseXml(sharedStringXml).getElementsByTagName('si')).map((item) =>
        Array.from(item.getElementsByTagName('t'))
          .map((node) => node.textContent ?? '')
          .join(''),
      )
    : []

  const sheet = parseXml(strFromU8(files[sheetPath]))
  const rows = Array.from(sheet.getElementsByTagName('row')).map((row) => {
    const cells: string[] = []
    Array.from(row.getElementsByTagName('c')).forEach((cell) => {
      const index = columnIndex(cell.getAttribute('r') ?? '')
      cells[index] = readCellValue(cell, sharedStrings).trim()
    })
    return cells
  })

  return rowsToObjects(rows)
}

async function parseImportFile(file: File) {
  const filename = file.name.toLowerCase()
  if (filename.endsWith('.xlsx')) {
    return parseXlsx(await file.arrayBuffer())
  }

  return parseCsv(await file.text())
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

function fileStem(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function headersFromRows(rows: ImportSourceRow[]) {
  const headers: string[] = []
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key)
      }
    })
  })
  return headers
}

function rejectedRowsForExport(rows: ImportPreviewRow[]) {
  return rows.map((row) => ({
    'Row Number': row.rowNumber,
    Errors: row.errors.join('; '),
    ...row.data,
  }))
}

function rowMatches(row: ImportPreviewRow, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const values = [
    row.rowNumber,
    row.action,
    row.errors.join(' '),
    ...Object.values(row.data),
    ...Object.values(row.normalized),
  ]
  return values.some((value) => String(value ?? '').toLowerCase().includes(normalized))
}

function dataPreview(row: ImportPreviewRow, source: 'data' | 'normalized') {
  const entries = Object.entries(source === 'data' ? row.data : row.normalized)
    .filter(([, value]) => String(value ?? '').trim().length > 0)
    .slice(0, 6)

  if (entries.length === 0) {
    return <span className="import-muted">No values</span>
  }

  return (
    <div className="import-data-preview">
      {entries.map(([key, value]) => (
        <span key={key}>
          <strong>{key}</strong>
          {String(value)}
        </span>
      ))}
    </div>
  )
}

function ImportRowsTable({
  rows,
  kind,
  emptyMessage,
}: {
  rows: ImportPreviewRow[]
  kind: 'accepted' | 'rejected'
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <div className="empty-state empty-state--boxed">
        {kind === 'accepted' ? <CheckCircle2 size={18} /> : <Search size={18} />}
        <span>{emptyMessage}</span>
      </div>
    )
  }

  return (
    <div className="import-table-wrap">
      <table className="import-table">
        <thead>
          <tr>
            <th>Row</th>
            <th>{kind === 'accepted' ? 'Action' : 'Issue'}</th>
            <th>{kind === 'accepted' ? 'Normalized data' : 'Submitted data'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${kind}-${row.rowNumber}`}>
              <td>{row.rowNumber}</td>
              <td>
                {kind === 'accepted' ? (
                  <span className={clsx('import-action-pill', `is-${row.action}`)}>{row.action}</span>
                ) : (
                  <div className="import-error-list">
                    {row.errors.map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                )}
              </td>
              <td>{dataPreview(row, kind === 'accepted' ? 'normalized' : 'data')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ImportCenter({ currentRole, userName, onAuditEvent }: ImportCenterProps) {
  const [activeKind, setActiveKind] = useState<ImportKind>('students')
  const [preview, setPreview] = useState<ImportPreviewPayload | null>(null)
  const [sourceRows, setSourceRows] = useState<ImportSourceRow[]>([])
  const [query, setQuery] = useState('')
  const [filename, setFilename] = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Choose an import file to validate with SQLite.')
  const [isLoading, setIsLoading] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const activeTemplate = templateMap.get(activeKind) ?? templates[0]

  const visibleValidRows = useMemo(
    () => (preview?.validRows ?? []).filter((row) => rowMatches(row, query)).slice(0, 60),
    [preview, query],
  )
  const visibleInvalidRows = useMemo(
    () => (preview?.invalidRows ?? []).filter((row) => rowMatches(row, query)).slice(0, 60),
    [preview, query],
  )
  const rejectedExportRows = useMemo(
    () => rejectedRowsForExport(preview?.invalidRows ?? []),
    [preview],
  )

  if (currentRole !== 'admin') {
    return null
  }

  const clearPreview = () => {
    setPreview(null)
    setSourceRows([])
    setFilename('')
    setQuery('')
    setBackendStatus('checking')
    setSyncMessage('Choose an import file to validate with SQLite.')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const selectKind = (kind: ImportKind) => {
    setActiveKind(kind)
    clearPreview()
  }

  const handleTemplateDownload = (format: ExportFormat) => {
    const basename = `campusops-${fileStem(activeTemplate.label)}-blank-template`
    if (format === 'csv') {
      downloadCsv(`${basename}.csv`, activeTemplate.columns)
    } else {
      downloadXlsx(`${basename}.xlsx`, activeTemplate.label, activeTemplate.columns)
    }
  }

  const handleRejectedExport = (format: ExportFormat) => {
    if (rejectedExportRows.length === 0) {
      return
    }

    const headers = headersFromRows(rejectedExportRows)
    const basename = `campusops-${fileStem(activeTemplate.label)}-rejected-${dateStamp()}`
    if (format === 'csv') {
      downloadCsv(`${basename}.csv`, headers, rejectedExportRows)
    } else {
      downloadXlsx(`${basename}.xlsx`, `${activeTemplate.label} rejected`, headers, rejectedExportRows)
    }

    onAuditEvent(
      makeAudit(
        userName,
        'Exported rejected import rows',
        `${activeTemplate.label} rejected rows exported as ${format.toUpperCase()}.`,
        'info',
      ),
    )
  }

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setIsLoading(true)
    setPreview(null)
    setSourceRows([])
    setFilename(file.name)
    setBackendStatus('checking')
    setSyncMessage('Validating import file with SQLite.')

    try {
      const rows = await parseImportFile(file)
      if (rows.length === 0) {
        throw new Error('The file does not contain any import rows.')
      }

      const payload = await previewImportOnServer(activeKind, rows)
      setSourceRows(rows)
      setPreview(payload)
      setBackendStatus('connected')
      setSyncMessage('SQLite backend connected.')
    } catch (error) {
      setBackendStatus('offline')
      setSyncMessage(error instanceof Error ? error.message : 'Import preview failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const commitValidRows = async () => {
    if (!preview || preview.summary.valid === 0) {
      return
    }

    setIsCommitting(true)
    setBackendStatus('checking')
    setSyncMessage('Saving accepted rows to SQLite.')

    try {
      const result = await commitImportOnServer(activeKind, sourceRows)
      setPreview(result)
      setBackendStatus('connected')
      setSyncMessage(`${result.importedRows} accepted ${activeTemplate.label.toLowerCase()} rows saved to SQLite.`)
      onAuditEvent(result.auditEvent, false)
    } catch (error) {
      setBackendStatus('offline')
      setSyncMessage(error instanceof Error ? error.message : 'Import commit failed.')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <section className="import-center">
      <div className="import-header">
        <div>
          <span className="eyebrow">Admin imports</span>
          <h2>College admin import center</h2>
          <p>Bulk upload validated CSV or XLSX rows for daily academic operations.</p>
          <div className={clsx('master-sync-chip', `is-${backendStatus}`)}>
            <span>{backendStatus === 'connected' ? 'SQLite backend' : backendStatus === 'checking' ? 'Import validation' : 'Needs attention'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="import-health">
          <Database size={18} />
          <strong>{preview?.summary.valid ?? 0}</strong>
          <span>accepted rows ready</span>
        </div>
      </div>

      <div className="import-kind-grid" aria-label="Import type">
        {templates.map((template) => (
          <button
            key={template.kind}
            type="button"
            className={clsx('import-kind-card', activeKind === template.kind && 'is-active')}
            onClick={() => selectKind(template.kind)}
          >
            <FileSpreadsheet size={18} />
            <strong>{template.label}</strong>
            <span>{template.description}</span>
          </button>
        ))}
      </div>

      <div className="import-controls">
        <div className="import-template-panel">
          <strong>{activeTemplate.label} template</strong>
          <span>{activeTemplate.columns.join(' / ')}</span>
        </div>
        <button type="button" className="secondary-action" onClick={() => handleTemplateDownload('csv')}>
          <Download size={15} />
          <span>CSV template</span>
        </button>
        <button type="button" className="secondary-action" onClick={() => handleTemplateDownload('xlsx')}>
          <FileSpreadsheet size={15} />
          <span>XLSX template</span>
        </button>
        <label className="primary-action import-upload">
          <UploadCloud size={16} />
          <span>{filename || 'Upload file'}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
          />
        </label>
        <button type="button" className="icon-button" aria-label="Clear import preview" onClick={clearPreview}>
          <RefreshCw size={17} />
        </button>
      </div>

      {preview ? (
        <>
          <div className="import-kpis">
            <article>
              <UploadCloud size={18} />
              <span>Total rows</span>
              <strong>{preview.totalRows}</strong>
            </article>
            <article>
              <CheckCircle2 size={18} />
              <span>Accepted</span>
              <strong>{preview.summary.valid}</strong>
            </article>
            <article>
              <AlertTriangle size={18} />
              <span>Rejected</span>
              <strong>{preview.summary.invalid}</strong>
            </article>
            <article>
              <Database size={18} />
              <span>Creates / updates</span>
              <strong>
                {preview.summary.creates} / {preview.summary.updates}
              </strong>
            </article>
          </div>

          <div className="import-toolbar">
            <label className="reports-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search preview rows"
                aria-label="Search import preview"
              />
            </label>
            <button
              type="button"
              className="primary-action"
              disabled={preview.summary.valid === 0 || isCommitting}
              onClick={commitValidRows}
            >
              <Database size={16} />
              <span>{isCommitting ? 'Saving rows' : 'Import valid rows'}</span>
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={preview.summary.invalid === 0}
              onClick={() => handleRejectedExport('csv')}
            >
              <Download size={15} />
              <span>Rejected CSV</span>
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={preview.summary.invalid === 0}
              onClick={() => handleRejectedExport('xlsx')}
            >
              <FileSpreadsheet size={15} />
              <span>Rejected XLSX</span>
            </button>
          </div>

          <div className="import-preview-grid">
            <section className="panel import-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Preview</span>
                  <h2>Accepted rows</h2>
                </div>
                <CheckCircle2 size={20} />
              </div>
              <ImportRowsTable rows={visibleValidRows} kind="accepted" emptyMessage="No accepted rows match this search." />
            </section>

            <section className="panel import-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Validation</span>
                  <h2>Rejected rows</h2>
                </div>
                <XCircle size={20} />
              </div>
              <ImportRowsTable rows={visibleInvalidRows} kind="rejected" emptyMessage="No rejected rows for this preview." />
            </section>
          </div>
        </>
      ) : (
        <div className="empty-state empty-state--boxed import-empty">
          {isLoading ? <RefreshCw size={20} /> : <UploadCloud size={20} />}
          <span>{isLoading ? 'Reading file and preparing preview.' : 'Upload a CSV or XLSX file to preview rows before saving.'}</span>
        </div>
      )}
    </section>
  )
}
