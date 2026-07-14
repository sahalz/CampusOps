import type { ImportKind, ImportSourceRow } from '../types'

export type ImportColumnMapping = Record<string, string>

export type ImportColumnDefinition = {
  label: string
  aliases: string[]
}

export type ImportDefinition = {
  kind: ImportKind
  columns: ImportColumnDefinition[]
}

export const importDefinitions: ImportDefinition[] = [
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

export function compactImportHeader(value: string) {
  return normalize(value).replace(/\s+/g, '')
}

export function detectImportKindFromHeaders(headers: string[], preferredKind: ImportKind = 'students') {
  const normalizedHeaders = headers.map(compactImportHeader)
  const scores = importDefinitions.map((definition) => {
    const matches = definition.columns.filter((column) =>
      [column.label, ...column.aliases]
        .some((alias) => normalizedHeaders.some((header) => header === compactImportHeader(alias))),
    ).length
    return { kind: definition.kind, confidence: matches / definition.columns.length }
  })
  const best = scores.sort((first, second) => second.confidence - first.confidence)[0]
  return best && best.confidence >= 0.5 ? best : { kind: preferredKind, confidence: 0 }
}

export function suggestImportColumnMapping(kind: ImportKind, headers: string[]) {
  const definition = importDefinitions.find((item) => item.kind === kind)
  const usedLabels = new Set<string>()

  return Object.fromEntries(headers.map((header) => {
    const headerValue = compactImportHeader(header)
    const matchedColumn = definition?.columns.find((column) =>
      !usedLabels.has(column.label)
      && [column.label, ...column.aliases].some((alias) => compactImportHeader(alias) === headerValue),
    )
    if (matchedColumn) {
      usedLabels.add(matchedColumn.label)
    }
    return [header, matchedColumn?.label ?? '']
  }))
}

export function applyImportColumnMapping(rows: ImportSourceRow[], mapping: ImportColumnMapping) {
  return rows.map((row) => Object.entries(mapping).reduce<ImportSourceRow>((mapped, [source, target]) => {
    if (target) {
      mapped[target] = row[source] ?? ''
    }
    return mapped
  }, {}))
}
