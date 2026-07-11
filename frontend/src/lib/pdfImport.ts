import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type { ImportKind, ImportSourceRow } from '../types'

type ImportColumnDefinition = {
  label: string
  aliases: string[]
}

type ImportDefinition = {
  kind: ImportKind
  columns: ImportColumnDefinition[]
}

type PositionedText = {
  text: string
  x: number
  y: number
  width: number
}

type PdfJsTextItem = {
  str: string
  transform: number[]
  width: number
}

type PdfLine = {
  page: number
  y: number
  items: PositionedText[]
}

type ColumnMatch = {
  label: string
  x: number
}

type HeaderCandidate = {
  definition: ImportDefinition
  page: number
  y: number
  matches: ColumnMatch[]
  confidence: number
}

export type PdfImportInsight = {
  format: 'PDF'
  pages: number
  detectedKind: ImportKind
  detectedColumns: string[]
  confidence: number
  warnings: string[]
}

export type PdfImportResult = {
  kind: ImportKind
  rows: ImportSourceRow[]
  insight: PdfImportInsight
}

const importDefinitions: ImportDefinition[] = [
  {
    kind: 'students',
    columns: [
      { label: 'Roll No', aliases: ['roll no', 'roll number', 'register no', 'reg no', 'admission no', 'student id'] },
      { label: 'Name', aliases: ['student name', 'name of student', 'name'] },
      { label: 'Class Section', aliases: ['class section', 'class and section', 'class', 'section', 'batch'] },
      { label: 'Email', aliases: ['student email', 'email id', 'email', 'mail id'] },
    ],
  },
  {
    kind: 'staff',
    columns: [
      { label: 'Employee Code', aliases: ['employee code', 'employee id', 'emp code', 'staff id'] },
      { label: 'Name', aliases: ['faculty name', 'staff name', 'employee name', 'name'] },
      { label: 'Department', aliases: ['department', 'dept'] },
      { label: 'Designation', aliases: ['designation', 'title', 'position'] },
      { label: 'Email', aliases: ['faculty email', 'staff email', 'email id', 'email'] },
      { label: 'Phone', aliases: ['phone number', 'mobile number', 'phone', 'mobile'] },
      { label: 'Status', aliases: ['employment status', 'status'] },
      { label: 'Joined At', aliases: ['joining date', 'joined at', 'date joined', 'joined'] },
      { label: 'Office Room', aliases: ['office room', 'cabin', 'room'] },
    ],
  },
  {
    kind: 'subjects',
    columns: [
      { label: 'Department Code', aliases: ['department code', 'dept code', 'department', 'dept'] },
      { label: 'Semester', aliases: ['semester', 'sem'] },
      { label: 'Code', aliases: ['subject code', 'course code', 'code'] },
      { label: 'Name', aliases: ['subject name', 'course name', 'name'] },
      { label: 'Credits', aliases: ['credit points', 'credits', 'credit'] },
      { label: 'Kind', aliases: ['subject type', 'course type', 'kind', 'type'] },
      { label: 'Default Faculty', aliases: ['default faculty', 'faculty name', 'faculty', 'teacher'] },
      { label: 'Status', aliases: ['subject status', 'status'] },
    ],
  },
  {
    kind: 'timetable',
    columns: [
      { label: 'Class Section', aliases: ['class section', 'class and section', 'class', 'section', 'batch'] },
      { label: 'Day', aliases: ['week day', 'weekday', 'day'] },
      { label: 'Period Number', aliases: ['period number', 'period no', 'period', 'hour', 'slot'] },
      { label: 'Start Time', aliases: ['start time', 'from time', 'start', 'from'] },
      { label: 'End Time', aliases: ['end time', 'to time', 'end', 'to'] },
      { label: 'Subject Code', aliases: ['subject code', 'course code', 'subject', 'course'] },
      { label: 'Teacher Email', aliases: ['teacher email', 'faculty email', 'teacher', 'faculty'] },
      { label: 'Room', aliases: ['classroom', 'room no', 'room', 'venue'] },
    ],
  },
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function compact(value: string) {
  return normalize(value).replace(/\s+/g, '')
}

function textItem(value: unknown): value is PdfJsTextItem {
  return Boolean(value && typeof value === 'object' && 'str' in value && 'transform' in value)
}

async function extractLines(data: Uint8Array) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const document = await getDocument({ data }).promise
  const lines: PdfLine[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items
      .flatMap<PositionedText>((item) => textItem(item)
        ? [{
            text: item.str.replace(/\s+/g, ' ').trim(),
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
          }]
        : [])
      .filter((item) => item.text.length > 0)
      .sort((first, second) => second.y - first.y || first.x - second.x)

    items.forEach((item) => {
      const line = lines.find((candidate) => candidate.page === pageNumber && Math.abs(candidate.y - item.y) <= 3.5)
      if (line) {
        line.items.push(item)
        line.y = (line.y + item.y) / 2
      } else {
        lines.push({ page: pageNumber, y: item.y, items: [item] })
      }
    })
  }

  lines.forEach((line) => line.items.sort((first, second) => first.x - second.x))
  lines.sort((first, second) => first.page - second.page || second.y - first.y)
  return { lines, pages: document.numPages }
}

function findAliasPosition(items: PositionedText[], aliases: string[]) {
  let bestX: number | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  const sorted = [...items].sort((first, second) => first.x - second.x)

  for (let start = 0; start < sorted.length; start += 1) {
    for (let size = 1; size <= 4 && start + size <= sorted.length; size += 1) {
      const candidateItems = sorted.slice(start, start + size)
      const candidate = compact(candidateItems.map((item) => item.text).join(' '))
      if (!candidate) {
        continue
      }

      for (const alias of aliases) {
        const aliasValue = compact(alias)
        const exact = candidate === aliasValue
        const closeContainment = candidate.includes(aliasValue) && candidate.length <= aliasValue.length + 8
        if (!exact && !closeContainment) {
          continue
        }

        const score = (exact ? 100 : 72) + aliasValue.length - size * 2
        if (score > bestScore) {
          bestX = Math.min(...candidateItems.map((item) => item.x))
          bestScore = score
        }
      }
    }
  }

  return bestX
}

function candidateForItems(definition: ImportDefinition, items: PositionedText[], page: number, y: number): HeaderCandidate {
  const matches = definition.columns
    .map((column) => {
      const x = findAliasPosition(items, column.aliases)
      return x === null ? null : { label: column.label, x }
    })
    .filter((match): match is ColumnMatch => Boolean(match))
  const distinctPositions = new Set(matches.map((match) => Math.round(match.x / 4))).size
  const usableMatches = distinctPositions >= Math.max(2, matches.length - 1) ? matches : []

  return {
    definition,
    page,
    y,
    matches: usableMatches,
    confidence: usableMatches.length / definition.columns.length,
  }
}

function headerCandidates(lines: PdfLine[]) {
  return lines.flatMap((line, index) => {
    const next = lines[index + 1]
    const itemGroups = [
      { items: line.items, y: line.y },
      ...(next && next.page === line.page && line.y - next.y <= 26
        ? [{ items: [...line.items, ...next.items], y: Math.min(line.y, next.y) }]
        : []),
    ]

    return itemGroups.flatMap((group) =>
      importDefinitions.map((definition) => candidateForItems(definition, group.items, line.page, group.y)),
    )
  })
}

function bestHeaderForKind(candidates: HeaderCandidate[], kind: ImportKind, page?: number) {
  return candidates
    .filter((candidate) => candidate.definition.kind === kind && (page === undefined || candidate.page === page))
    .sort((first, second) => second.confidence - first.confidence || first.page - second.page || second.y - first.y)[0]
}

function minimumHeaderConfidence(kind: ImportKind) {
  return kind === 'students' ? 0.75 : kind === 'timetable' ? 0.625 : 0.5
}

function looksLikeHeader(line: PdfLine, definition: ImportDefinition) {
  const lineText = compact(line.items.map((item) => item.text).join(' '))
  const matches = definition.columns.filter((column) => column.aliases.some((alias) => lineText.includes(compact(alias))))
  return matches.length >= Math.max(2, Math.ceil(definition.columns.length / 2))
}

function rowFromLine(line: PdfLine, columns: ColumnMatch[]) {
  const sortedColumns = [...columns].sort((first, second) => first.x - second.x)
  if (sortedColumns.length < 2) {
    return null
  }

  const firstGap = sortedColumns[1].x - sortedColumns[0].x
  const leftBoundary = sortedColumns[0].x - Math.max(16, firstGap * 0.38)
  const boundaries = sortedColumns.slice(0, -1).map((column, index) => (column.x + sortedColumns[index + 1].x) / 2)
  const values = new Map(sortedColumns.map((column) => [column.label, [] as PositionedText[]]))

  line.items.forEach((item) => {
    if (item.x < leftBoundary) {
      return
    }
    const columnIndex = boundaries.findIndex((boundary) => item.x < boundary)
    const target = sortedColumns[columnIndex === -1 ? sortedColumns.length - 1 : columnIndex]
    values.get(target.label)?.push(item)
  })

  const row = Object.fromEntries(
    sortedColumns.map((column) => [
      column.label,
      (values.get(column.label) ?? [])
        .sort((first, second) => first.x - second.x)
        .map((item) => item.text)
        .join(' ')
        .trim(),
    ]),
  ) as ImportSourceRow
  const populatedValues = Object.values(row).filter((value) => String(value ?? '').trim().length > 0)
  return populatedValues.length >= 2 ? row : null
}

export function detectImportKindFromHeaders(headers: string[], preferredKind: ImportKind = 'students') {
  const normalizedHeaders = headers.map(compact)
  const scores = importDefinitions.map((definition) => {
    const matches = definition.columns.filter((column) =>
      column.aliases.some((alias) => normalizedHeaders.some((header) => header === compact(alias))),
    ).length
    return { kind: definition.kind, confidence: matches / definition.columns.length }
  })
  const best = scores.sort((first, second) => second.confidence - first.confidence)[0]
  return best && best.confidence >= 0.5 ? best : { kind: preferredKind, confidence: 0 }
}

export async function extractPdfImport(data: Uint8Array, preferredKind: ImportKind = 'students'): Promise<PdfImportResult> {
  const { lines, pages } = await extractLines(data)
  if (lines.length === 0) {
    throw new Error('This PDF has no selectable text. Use a text-based PDF, CSV, or XLSX file.')
  }

  const candidates = headerCandidates(lines)
  const detected = [...candidates].sort((first, second) => second.confidence - first.confidence)[0]
  const detectedKind = detected && detected.confidence >= minimumHeaderConfidence(detected.definition.kind)
    ? detected.definition.kind
    : preferredKind
  const primaryHeader = bestHeaderForKind(candidates, detectedKind)

  if (!primaryHeader || primaryHeader.confidence < minimumHeaderConfidence(detectedKind)) {
    throw new Error(`Could not recognize a ${detectedKind} table header in this PDF. Include clear column labels or use the downloadable template.`)
  }

  const warnings: string[] = []
  const missingColumns = primaryHeader.definition.columns
    .map((column) => column.label)
    .filter((label) => !primaryHeader.matches.some((match) => match.label === label))
  if (missingColumns.length > 0) {
    warnings.push(`Unrecognized columns: ${missingColumns.join(', ')}. Rows missing these values will remain in Needs correction.`)
  }

  const rows: ImportSourceRow[] = []
  for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
    const pageLines = lines.filter((line) => line.page === pageNumber)
    const pageHeaderCandidate = bestHeaderForKind(candidates, detectedKind, pageNumber)
    const pageHeader = pageHeaderCandidate && pageHeaderCandidate.confidence >= minimumHeaderConfidence(detectedKind)
      ? pageHeaderCandidate
      : null
    const columns = pageHeader?.matches ?? primaryHeader.matches

    if (!pageHeader && pageNumber > 1) {
      warnings.push(`Page ${pageNumber} reused the column positions detected on page ${primaryHeader.page}.`)
    }

    pageLines.forEach((line) => {
      if (pageHeader && line.y >= pageHeader.y - 2) {
        return
      }
      if (looksLikeHeader(line, primaryHeader.definition)) {
        return
      }
      const row = rowFromLine(line, columns)
      if (row) {
        rows.push(row)
      }
    })
  }

  if (rows.length === 0) {
    throw new Error('A table header was found, but no data rows could be reconstructed from this PDF.')
  }

  return {
    kind: detectedKind,
    rows,
    insight: {
      format: 'PDF',
      pages,
      detectedKind,
      detectedColumns: primaryHeader.matches.map((match) => match.label),
      confidence: Math.round(primaryHeader.confidence * 100),
      warnings: [...new Set(warnings)],
    },
  }
}
