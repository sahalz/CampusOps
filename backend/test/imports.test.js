import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const testDirectory = mkdtempSync(join(tmpdir(), 'campusops-imports-'))
process.env.CAMPUSOPS_DB_PATH = join(testDirectory, 'campusops-test.sqlite')

const { previewImportRows } = await import('../src/db.js')

after(() => {
  rmSync(testDirectory, { recursive: true, force: true })
})

function timetableRow(overrides = {}) {
  return {
    'Class Section': 'CSE-B',
    Day: 'Wednesday',
    'Period Number': '1',
    'Start Time': '09:00',
    'End Time': '10:00',
    'Subject Code': 'CS501',
    'Teacher Email': 'anjali.rao@campus.edu',
    Room: 'TEST-101',
    ...overrides,
  }
}

test('a corrected student row moves from rejected to ready', () => {
  const invalid = previewImportRows('students', [{
    'Roll No': 'CSE5A99',
    Name: 'Test Student',
    'Class Section': 'Unknown Class',
    Email: 'test.student@campus.edu',
  }])

  assert.equal(invalid.summary.valid, 0)
  assert.equal(invalid.summary.invalid, 1)
  assert.match(invalid.invalidRows[0].errors.join(' '), /Class Section/)

  const corrected = previewImportRows('students', [{
    'Roll No': 'CSE5A99',
    Name: 'Test Student',
    'Class Section': 'CSE-A',
    Email: 'test.student@campus.edu',
  }])

  assert.equal(corrected.summary.valid, 1)
  assert.equal(corrected.summary.invalid, 0)
  assert.equal(corrected.validRows[0].action, 'create')
})

test('a natural class-day-period match is recognized as a timetable update', () => {
  const preview = previewImportRows('timetable', [timetableRow({
    'Class Section': 'CSE-A',
    Day: 'Monday',
    'Period Number': '1',
    'Start Time': '09:00',
    'End Time': '10:00',
    'Teacher Email': 'anjali.rao@campus.edu',
    Room: 'B-204',
  })])

  assert.equal(preview.summary.valid, 1)
  assert.equal(preview.summary.conflicts, 0)
  assert.equal(preview.validRows[0].action, 'update')
  assert.equal(preview.validRows[0].normalized.id, 'slot-cse5a-mon-1')
})

test('an existing teacher overlap is rejected before saving', () => {
  const preview = previewImportRows('timetable', [timetableRow({
    Day: 'Tuesday',
    'Period Number': '2',
    'Start Time': '09:30',
    'End Time': '10:30',
    'Teacher Email': 'neha.iyer@campus.edu',
  })])

  assert.equal(preview.summary.valid, 0)
  assert.equal(preview.summary.conflicts, 1)
  assert.match(preview.invalidRows[0].conflicts.join(' '), /Prof\. Neha Iyer is already assigned/)
})

test('an existing room overlap is rejected before saving', () => {
  const preview = previewImportRows('timetable', [timetableRow({
    Day: 'Tuesday',
    'Period Number': '3',
    'Start Time': '09:30',
    'End Time': '10:30',
    'Teacher Email': 'vikram.menon@campus.edu',
    Room: 'B-204',
  })])

  assert.equal(preview.summary.valid, 0)
  assert.equal(preview.summary.conflicts, 1)
  assert.match(preview.invalidRows[0].conflicts.join(' '), /Room B-204 is already used/)
})

test('teacher overlaps between two rows in the same upload reject both rows', () => {
  const preview = previewImportRows('timetable', [
    timetableRow({ 'Class Section': 'CSE-A', 'Period Number': '4', Room: 'TEST-201' }),
    timetableRow({
      'Class Section': 'CSE-B',
      'Period Number': '5',
      'Start Time': '09:30',
      'End Time': '10:30',
      Room: 'TEST-202',
    }),
  ])

  assert.equal(preview.summary.valid, 0)
  assert.equal(preview.summary.invalid, 2)
  assert.equal(preview.summary.conflicts, 2)
  preview.invalidRows.forEach((row) => assert.match(row.conflicts.join(' '), /uploaded row/))
})

test('duplicate class-day-period rows in one file are rejected', () => {
  const preview = previewImportRows('timetable', [
    timetableRow({ Day: 'Thursday', 'Period Number': '2', Room: 'TEST-301' }),
    timetableRow({
      Day: 'Thursday',
      'Period Number': '2',
      'Teacher Email': 'vikram.menon@campus.edu',
      Room: 'TEST-302',
    }),
  ])

  assert.equal(preview.summary.conflicts, 2)
  assert.equal(preview.summary.invalid, 2)
  preview.invalidRows.forEach((row) => assert.match(row.conflicts.join(' '), /appears more than once/))
})

test('a timetable row cannot end before it starts', () => {
  const preview = previewImportRows('timetable', [timetableRow({
    'Start Time': '11:00',
    'End Time': '10:00',
  })])

  assert.equal(preview.summary.valid, 0)
  assert.equal(preview.summary.conflicts, 0)
  assert.match(preview.invalidRows[0].errors.join(' '), /End Time must be later/)
})
