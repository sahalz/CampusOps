import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyImportColumnMapping,
  detectImportKindFromHeaders,
  suggestImportColumnMapping,
} from '../src/lib/importSchema.ts'

test('student aliases are detected and mapped to canonical fields', () => {
  const headers = ['Register No', 'Student Name', 'Batch', 'Email ID']
  const detection = detectImportKindFromHeaders(headers, 'staff')
  const mapping = suggestImportColumnMapping('students', headers)

  assert.equal(detection.kind, 'students')
  assert.equal(detection.confidence, 1)
  assert.deepEqual(mapping, {
    'Register No': 'Roll No',
    'Student Name': 'Name',
    Batch: 'Class Section',
    'Email ID': 'Email',
  })
})

test('unknown columns remain available for manual mapping', () => {
  const headers = ['Register Number', 'Full Name', 'Batch Name', 'Institution Mail']
  const automatic = suggestImportColumnMapping('students', headers)

  assert.deepEqual(automatic, {
    'Register Number': '',
    'Full Name': '',
    'Batch Name': '',
    'Institution Mail': '',
  })

  const manuallyMapped = applyImportColumnMapping(
    [{
      'Register Number': 'CSE5A99',
      'Full Name': 'Test Student',
      'Batch Name': 'CSE-A',
      'Institution Mail': 'test.student@campus.edu',
    }],
    {
      'Register Number': 'Roll No',
      'Full Name': 'Name',
      'Batch Name': 'Class Section',
      'Institution Mail': 'Email',
    },
  )

  assert.deepEqual(manuallyMapped, [{
    'Roll No': 'CSE5A99',
    Name: 'Test Student',
    'Class Section': 'CSE-A',
    Email: 'test.student@campus.edu',
  }])
})

test('one target field is not automatically assigned twice', () => {
  const mapping = suggestImportColumnMapping('students', ['Student Name', 'Name', 'Roll No', 'Email'])

  assert.equal(mapping['Student Name'], 'Name')
  assert.equal(mapping.Name, '')
})
