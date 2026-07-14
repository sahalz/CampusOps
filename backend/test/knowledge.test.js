import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const testDirectory = mkdtempSync(join(tmpdir(), 'campusops-knowledge-'))
process.env.CAMPUSOPS_DB_PATH = join(testDirectory, 'campusops-knowledge.sqlite')

const {
  createKnowledgeDocument,
  getKnowledgeState,
  runKnowledgeEvaluation,
  searchKnowledgeBase,
} = await import('../src/db.js')

const admin = { role: 'admin', name: 'Test Admin', actorId: 'admin-office' }
const student = { role: 'student', name: 'Test Student', actorId: 's-aisha' }

after(() => {
  rmSync(testDirectory, { recursive: true, force: true })
})

test('related wording retrieves the attendance policy through hybrid search', () => {
  const result = searchKnowledgeBase(
    { query: 'What is the minimum presence requirement for students?' },
    admin,
    { audit: false },
  )

  assert.equal(result.grounded, true)
  assert.equal(result.retrievalMode, 'sqlite-fts5+concepts')
  assert.equal(result.citations[0].documentId, 'kb-attendance-leave')
  assert.match(result.answer, /75 percent attendance/)
  assert.ok(result.citations[0].matchReasons.includes('related policy concept'))
})

test('document visibility is applied before retrieval', () => {
  createKnowledgeDocument({
    title: 'Administrative Quasar Protocol',
    source: 'Principal Office',
    owner: 'Principal',
    tags: ['quasarprotocol'],
    audience: 'admin',
    versionLabel: '1.0',
    format: 'text',
    body: '# Quasar protocol\nThe quasarprotocol keyword identifies a confidential administrative procedure that only authorized college administrators may review and apply during a controlled governance exercise.',
  }, admin.name)

  const adminResult = searchKnowledgeBase({ query: 'quasarprotocol' }, admin, { audit: false })
  const studentResult = searchKnowledgeBase({ query: 'quasarprotocol' }, student, { audit: false })

  assert.equal(adminResult.citations[0].title, 'Administrative Quasar Protocol')
  assert.equal(studentResult.citations.length, 0)
  assert.equal(studentResult.grounded, false)
  assert.ok(!getKnowledgeState(student).documents.some((document) => document.title === 'Administrative Quasar Protocol'))
})

test('page-aware ingestion preserves the original PDF page number', () => {
  createKnowledgeDocument({
    title: 'Moonlight Waiver Policy',
    source: 'moonlight-waiver.pdf',
    owner: 'Academic Office',
    tags: ['moonlight', 'waiver'],
    audience: 'everyone',
    versionLabel: '2.1',
    format: 'pdf',
    pages: [
      { pageNumber: 1, text: 'Moonlight Waiver Policy\nThis opening page explains the purpose and ownership of the approved waiver process.' },
      { pageNumber: 2, text: 'Approval rule\nA moonlight waiver requires the academic dean to record approval before the exception becomes active for a student.' },
    ],
  }, admin.name)

  const result = searchKnowledgeBase({ query: 'Who approves a moonlight waiver?' }, admin, { audit: false })
  const document = getKnowledgeState(admin).documents.find((item) => item.title === 'Moonlight Waiver Policy')

  assert.equal(result.citations[0].pageNumber, 2)
  assert.equal(result.citations[0].format, 'pdf')
  assert.equal(result.citations[0].versionLabel, '2.1')
  assert.equal(document?.pageCount, 2)
})

test('expired policies are excluded from retrieval', () => {
  createKnowledgeDocument({
    title: 'Expired Nebula Rule',
    source: 'Old Handbook',
    owner: 'Archive Office',
    tags: ['nebulaterm'],
    audience: 'everyone',
    versionLabel: '0.5',
    effectiveAt: '2020-01-01',
    expiresAt: '2020-12-31',
    format: 'text',
    body: '# Historical rule\nThe nebulaterm rule was used only during the 2020 academic year and must not be used for a current college decision.',
  }, admin.name)

  const result = searchKnowledgeBase({ query: 'nebulaterm' }, admin, { audit: false })
  assert.equal(result.citations.length, 0)
  assert.equal(result.grounded, false)
})

test('the approved RAG evaluation set passes every case', () => {
  const evaluation = runKnowledgeEvaluation(admin)

  assert.equal(evaluation.total, 6)
  assert.equal(evaluation.passed, 6)
  assert.equal(evaluation.accuracy, 100)
  assert.equal(evaluation.citationAccuracy, 100)
  assert.equal(evaluation.answerSupport, 100)
})
