import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const testDirectory = mkdtempSync(join(tmpdir(), 'campusops-automation-'))
process.env.CAMPUSOPS_DB_PATH = join(testDirectory, 'campusops-automation.sqlite')

const {
  decideAutomationRun,
  getAutomationState,
  markAutomationNotificationRead,
  resetAutomationData,
  runAutomationRules,
  updateAutomationRule,
} = await import('../src/db.js')

const actor = 'Automation Test Admin'

after(() => {
  rmSync(testDirectory, { recursive: true, force: true })
})

test('automation rules are seeded as enabled SQLite controls', () => {
  const state = getAutomationState()

  assert.equal(state.source, 'sqlite')
  assert.equal(state.summary.rules, 5)
  assert.equal(state.summary.enabledRules, 5)
  assert.equal(state.runs.length, 0)
})

test('an approval-gated run is deduplicated and releases notifications only after approval', () => {
  const first = runAutomationRules({ ruleId: 'auto-leave-escalation' }, actor)
  const firstRun = first.runs[0]

  assert.equal(firstRun.status, 'awaiting_approval')
  assert.equal(firstRun.matchCount, 1)
  assert.equal(firstRun.notificationCount, 0)
  assert.equal(firstRun.deduplicated, false)

  const duplicate = runAutomationRules({ ruleId: 'auto-leave-escalation' }, actor).runs[0]
  assert.equal(duplicate.id, firstRun.id)
  assert.equal(duplicate.deduplicated, true)

  const decision = decideAutomationRun(firstRun.id, { decision: 'approve' }, actor)
  assert.equal(decision.run.status, 'completed')
  assert.equal(decision.run.notificationCount, 1)
  assert.equal(decision.state.summary.unreadNotifications, 1)

  const notification = decision.state.notifications[0]
  const readResult = markAutomationNotificationRead(notification.id)
  assert.equal(readResult.notification.status, 'read')
  assert.equal(readResult.state.summary.unreadNotifications, 0)
})

test('admins can pause a rule and reset automation history', () => {
  const updated = updateAutomationRule(
    'auto-attendance-reminder',
    { enabled: false, cooldownMinutes: 60 },
    actor,
  )

  assert.equal(updated.rule.enabled, false)
  assert.equal(updated.rule.cooldownMinutes, 60)
  assert.equal(updated.state.summary.enabledRules, 4)

  const reset = resetAutomationData(actor)
  assert.equal(reset.summary.enabledRules, 5)
  assert.equal(reset.runs.length, 0)
  assert.equal(reset.notifications.length, 0)
})
