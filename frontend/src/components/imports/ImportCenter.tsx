import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  Search,
  Sparkles,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { commitImportOnServer, previewImportOnServer } from '../../lib/api'
import { extractPdfImport, type PdfImportInsight } from '../../lib/pdfImport'
import {
  applyImportColumnMapping,
  detectImportKindFromHeaders,
  suggestImportColumnMapping,
  type ImportColumnMapping,
} from '../../lib/importSchema'
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
    label: 'Student list',
    description: 'Roll numbers, class sections, and student email records.',
    columns: ['Roll No', 'Name', 'Class Section', 'Email'],
  },
  {
    kind: 'staff',
    label: 'Staff list',
    description: 'Faculty profiles linked to teacher workload and contact data.',
    columns: ['Employee Code', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Status', 'Joined At', 'Office Room'],
  },
  {
    kind: 'subjects',
    label: 'Subject list',
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

async function parseImportFile(file: File, preferredKind: ImportKind) {
  const filename = file.name.toLowerCase()
  if (filename.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfImport(new Uint8Array(await file.arrayBuffer()), preferredKind)
  }

  let rows: ImportSourceRow[]
  if (filename.endsWith('.xlsx')) {
    rows = parseXlsx(await file.arrayBuffer())
  } else {
    rows = parseCsv(await file.text())
  }

  const detection = detectImportKindFromHeaders(Object.keys(rows[0] ?? {}), preferredKind)
  return {
    kind: detection.confidence >= 0.75 ? detection.kind : preferredKind,
    rows,
    insight: null,
  }
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
  onEdit,
}: {
  rows: ImportPreviewRow[]
  kind: 'accepted' | 'rejected'
  emptyMessage: string
  onEdit: (rowNumber: number) => void
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
            <th>Review</th>
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
              <td>
                <button type="button" className="import-edit-button" onClick={() => onEdit(row.rowNumber)}>
                  <Pencil size={14} />
                  <span>Edit row</span>
                </button>
              </td>
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
  const [rawRows, setRawRows] = useState<ImportSourceRow[]>([])
  const [sourceRows, setSourceRows] = useState<ImportSourceRow[]>([])
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ImportColumnMapping>({})
  const [mappingOpen, setMappingOpen] = useState(false)
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ImportSourceRow>({})
  const [query, setQuery] = useState('')
  const [filename, setFilename] = useState('')
  const [pdfInsight, setPdfInsight] = useState<PdfImportInsight | null>(null)
  const [previewTab, setPreviewTab] = useState<'accepted' | 'rejected'>('accepted')
  const [isDragging, setIsDragging] = useState(false)
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
  const mappedColumnCount = Object.values(columnMapping).filter(Boolean).length
  const selectedMappingTargets = new Set(Object.values(columnMapping).filter(Boolean))

  if (currentRole !== 'admin') {
    return null
  }

  const clearPreview = () => {
    setPreview(null)
    setRawRows([])
    setSourceRows([])
    setSourceHeaders([])
    setColumnMapping({})
    setMappingOpen(false)
    setEditingRowNumber(null)
    setEditDraft({})
    setFilename('')
    setPdfInsight(null)
    setPreviewTab('accepted')
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

  const applyMappingAndRecheck = async () => {
    const mappedRows = applyImportColumnMapping(rawRows, columnMapping)
    if (mappedRows.length === 0 || mappedColumnCount === 0) {
      setBackendStatus('offline')
      setSyncMessage('Map at least one file column before checking the rows.')
      return
    }

    setIsLoading(true)
    setBackendStatus('checking')
    setSyncMessage('Applying the selected columns and rechecking every row.')
    setEditingRowNumber(null)

    try {
      const payload = await previewImportOnServer(activeKind, mappedRows)
      setSourceRows(mappedRows)
      setPreview(payload)
      setBackendStatus('connected')
      setSyncMessage(`${mappedColumnCount} file columns mapped. ${payload.summary.valid} rows are ready to save.`)
      setMappingOpen(false)
      setPreviewTab(payload.summary.valid > 0 ? 'accepted' : 'rejected')
    } catch (error) {
      setBackendStatus('offline')
      setSyncMessage(error instanceof Error ? error.message : 'Column mapping could not be validated.')
    } finally {
      setIsLoading(false)
    }
  }

  const beginRowEdit = (rowNumber: number) => {
    const sourceRow = sourceRows[rowNumber - 2] ?? {}
    setEditingRowNumber(rowNumber)
    setEditDraft(Object.fromEntries(
      activeTemplate.columns.map((column) => [column, sourceRow[column] ?? '']),
    ))
  }

  const saveRowCorrection = async () => {
    if (editingRowNumber === null) {
      return
    }

    const rowIndex = editingRowNumber - 2
    const correctedRows = sourceRows.map((row, index) => index === rowIndex ? { ...row, ...editDraft } : row)
    setIsLoading(true)
    setBackendStatus('checking')
    setSyncMessage(`Rechecking corrected row ${editingRowNumber}.`)

    try {
      const payload = await previewImportOnServer(activeKind, correctedRows)
      const stillNeedsCorrection = payload.invalidRows.some((row) => row.rowNumber === editingRowNumber)
      setSourceRows(correctedRows)
      setPreview(payload)
      setBackendStatus('connected')
      setSyncMessage(
        stillNeedsCorrection
          ? `Row ${editingRowNumber} still needs attention. Review the remaining issue below.`
          : `Row ${editingRowNumber} is corrected and ready to save.`,
      )
      setPreviewTab(stillNeedsCorrection ? 'rejected' : 'accepted')
      setEditingRowNumber(null)
      setEditDraft({})
    } catch (error) {
      setBackendStatus('offline')
      setSyncMessage(error instanceof Error ? error.message : 'Corrected row could not be validated.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setIsLoading(true)
    setPreview(null)
    setRawRows([])
    setSourceRows([])
    setSourceHeaders([])
    setColumnMapping({})
    setMappingOpen(false)
    setEditingRowNumber(null)
    setEditDraft({})
    setFilename(file.name)
    setPdfInsight(null)
    setPreviewTab('accepted')
    setBackendStatus('checking')
    setSyncMessage('Validating import file with SQLite.')

    try {
      const parsed = await parseImportFile(file, activeKind)
      if (parsed.rows.length === 0) {
        throw new Error('The file does not contain any import rows.')
      }

      if (parsed.kind !== activeKind) {
        setActiveKind(parsed.kind)
      }
      const headers = headersFromRows(parsed.rows)
      const mapping = suggestImportColumnMapping(parsed.kind, headers)
      const mappedRows = applyImportColumnMapping(parsed.rows, mapping)
      const payload = await previewImportOnServer(parsed.kind, mappedRows)
      setRawRows(parsed.rows)
      setSourceHeaders(headers)
      setColumnMapping(mapping)
      setMappingOpen(Object.values(mapping).some((target) => !target))
      setSourceRows(mappedRows)
      setPdfInsight(parsed.insight)
      setPreview(payload)
      setBackendStatus('connected')
      setSyncMessage(
        parsed.insight
          ? `PDF columns mapped automatically with ${parsed.insight.confidence}% confidence.`
          : 'File columns mapped and validated with SQLite.',
      )
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
          <span className="eyebrow">Simple upload</span>
          <h2>Upload college data</h2>
          <p>Choose the list, add a PDF, CSV, or XLSX file, review the automatically mapped rows, and save only the correct records.</p>
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

      <div className="import-section-heading">
        <span>1</span>
        <div>
          <strong>What are you uploading?</strong>
          <small>Select a list type. A PDF with clear headers can correct this choice automatically.</small>
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

      <div className="import-section-heading">
        <span>2</span>
        <div>
          <strong>Add the file</strong>
          <small>Text-based PDFs are read by position and converted into the selected list automatically.</small>
        </div>
      </div>
      <div
        className={clsx('import-dropzone', isDragging && 'is-dragging')}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void handleFileChange(event.dataTransfer.files?.[0])
        }}
      >
        <span className="import-dropzone__icon"><UploadCloud size={24} /></span>
        <div>
          <strong>{filename || `Drop the ${activeTemplate.label.toLowerCase()} here`}</strong>
          <span>PDF, CSV, or XLSX - up to 1,000 rows per import</span>
        </div>
        <label className="primary-action import-upload">
          <FileText size={16} />
          <span>{filename ? 'Choose another file' : 'Choose file'}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
          />
        </label>
        {filename ? (
          <button type="button" className="icon-button" aria-label="Clear import preview" onClick={clearPreview}>
            <RefreshCw size={17} />
          </button>
        ) : null}
      </div>
      <div className="import-template-help">
        <span>Need the correct column format?</span>
        <button type="button" onClick={() => handleTemplateDownload('csv')}><Download size={14} />CSV template</button>
        <button type="button" onClick={() => handleTemplateDownload('xlsx')}><FileSpreadsheet size={14} />XLSX template</button>
      </div>

      {preview ? (
        <>
          {pdfInsight ? (
            <div className="import-mapping-banner">
              <span className="import-mapping-icon"><Sparkles size={20} /></span>
              <div>
                <strong>PDF mapped as {activeTemplate.label}</strong>
                <p>{pdfInsight.detectedColumns.join(' / ')}</p>
                {pdfInsight.warnings.map((warning) => <small key={warning}>{warning}</small>)}
              </div>
              <span className="import-confidence">{pdfInsight.confidence}% match</span>
            </div>
          ) : null}
          <section className={clsx('import-column-mapping', mappingOpen && 'is-open')}>
            <div className="import-column-mapping__summary">
              <span className="import-mapping-icon"><SlidersHorizontal size={19} /></span>
              <div>
                <strong>Column mapping</strong>
                <small>{mappedColumnCount} of {sourceHeaders.length} file columns matched</small>
              </div>
              <button
                type="button"
                className="secondary-action"
                aria-expanded={mappingOpen}
                onClick={() => setMappingOpen((open) => !open)}
              >
                <SlidersHorizontal size={15} />
                <span>{mappingOpen ? 'Hide mapping' : 'Review mapping'}</span>
              </button>
            </div>
            {mappingOpen ? (
              <div className="import-column-mapping__body">
                <p>Match each heading in the file to the correct CampusOps field. Unneeded columns can be ignored.</p>
                <div className="import-column-mapping__grid">
                  {sourceHeaders.map((header) => (
                    <label key={header}>
                      <span>{header}</span>
                      <select
                        value={columnMapping[header] ?? ''}
                        onChange={(event) => setColumnMapping((current) => ({ ...current, [header]: event.target.value }))}
                      >
                        <option value="">Ignore this column</option>
                        {activeTemplate.columns.map((column) => (
                          <option
                            key={column}
                            value={column}
                            disabled={columnMapping[header] !== column && selectedMappingTargets.has(column)}
                          >
                            {column}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="import-column-mapping__actions">
                  <small>Applying mapping rechecks the original file rows. Make mapping changes before editing individual rows.</small>
                  <button type="button" className="primary-action" disabled={isLoading} onClick={() => void applyMappingAndRecheck()}>
                    <RefreshCw size={15} />
                    <span>{isLoading ? 'Checking rows' : 'Apply mapping and recheck'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </section>
          <div className="import-section-heading import-section-heading--review">
            <span>3</span>
            <div>
              <strong>Review before saving</strong>
              <small>Correct rows are ready. Uncertain or incomplete rows stay separate and are never saved automatically.</small>
            </div>
          </div>
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
            <article className={clsx(preview.summary.conflicts > 0 && 'is-warning')}>
              <AlertTriangle size={18} />
              <span>Timetable conflicts</span>
              <strong>{preview.summary.conflicts}</strong>
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
            <div className="segmented-control import-preview-tabs" aria-label="Preview status">
              <button type="button" className={clsx(previewTab === 'accepted' && 'is-active')} onClick={() => setPreviewTab('accepted')}>
                Ready ({preview.summary.valid})
              </button>
              <button type="button" className={clsx(previewTab === 'rejected' && 'is-active')} onClick={() => setPreviewTab('rejected')}>
                Needs correction ({preview.summary.invalid})
              </button>
            </div>
            <button
              type="button"
              className="primary-action"
              disabled={preview.summary.valid === 0 || isCommitting}
              onClick={commitValidRows}
            >
              <FileCheck2 size={16} />
              <span>{isCommitting ? 'Saving rows' : `Save ${preview.summary.valid} correct rows`}</span>
            </button>
            {previewTab === 'rejected' ? (
              <button type="button" className="secondary-action" disabled={preview.summary.invalid === 0} onClick={() => handleRejectedExport('xlsx')}>
                <Download size={15} />
                <span>Download correction file</span>
              </button>
            ) : null}
          </div>

          <section className="panel import-panel import-panel--single">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{previewTab === 'accepted' ? 'Ready to save' : 'Review required'}</span>
                <h2>{previewTab === 'accepted' ? 'Correctly mapped rows' : 'Rows needing correction'}</h2>
              </div>
              {previewTab === 'accepted' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            {editingRowNumber !== null ? (
              <div className="import-row-editor" role="region" aria-label={`Edit import row ${editingRowNumber}`}>
                <div className="import-row-editor__heading">
                  <div>
                    <strong>Edit row {editingRowNumber}</strong>
                    <small>Correct the values, then recheck the row before saving.</small>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Cancel row editing"
                    onClick={() => {
                      setEditingRowNumber(null)
                      setEditDraft({})
                    }}
                  >
                    <XCircle size={17} />
                  </button>
                </div>
                <div className="import-row-editor__grid">
                  {activeTemplate.columns.map((column) => (
                    <label key={column}>
                      <span>{column}</span>
                      <input
                        value={String(editDraft[column] ?? '')}
                        onChange={(event) => setEditDraft((current) => ({ ...current, [column]: event.target.value }))}
                      />
                    </label>
                  ))}
                </div>
                <div className="import-row-editor__actions">
                  <button type="button" className="primary-action" disabled={isLoading} onClick={() => void saveRowCorrection()}>
                    <FileCheck2 size={15} />
                    <span>{isLoading ? 'Rechecking' : 'Save correction and recheck'}</span>
                  </button>
                </div>
              </div>
            ) : null}
            <ImportRowsTable
              rows={previewTab === 'accepted' ? visibleValidRows : visibleInvalidRows}
              kind={previewTab}
              emptyMessage={previewTab === 'accepted' ? 'No correct rows match this search.' : 'No rows need correction.'}
              onEdit={beginRowEdit}
            />
          </section>
        </>
      ) : (
        <div className="empty-state empty-state--boxed import-empty">
          {isLoading ? <RefreshCw size={20} /> : <UploadCloud size={20} />}
          <span>{isLoading ? 'Reading the file, mapping columns, and checking every row.' : 'Your mapped preview will appear here. Nothing is saved until you approve the correct rows.'}</span>
        </div>
      )}
    </section>
  )
}
