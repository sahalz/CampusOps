import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import {
  decideAutomationRunOnServer,
  fetchAutomationState,
  markAutomationNotificationReadOnServer,
  resetAutomationOnServer,
  retryAutomationRunOnServer,
  runAutomationsOnServer,
  updateAutomationRuleOnServer,
} from '../../lib/api'
import type {
  AuditEvent,
  AutomationRule,
  AutomationRun,
  AutomationState,
} from '../../types'

type AutomationCenterProps = {
  userName: string
  onAuditEvent: (event: AuditEvent) => void
}

const emptyAutomationState: AutomationState = {
  version: 1,
  source: 'sqlite',
  generatedAt: '',
  summary: {
    rules: 0,
    enabledRules: 0,
    runsToday: 0,
    completedRuns: 0,
    awaitingApproval: 0,
    failedRuns: 0,
    unreadNotifications: 0,
  },
  rules: [],
  runs: [],
  notifications: [],
}

const triggerLabels: Record<AutomationRule['triggerType'], string> = {
  attendance_gap: 'Attendance remains unmarked',
  pending_leave: 'Leave request is pending',
  attendance_shortage: 'Student falls below threshold',
  circular_unread: 'Active circular has unread recipients',
  policy_expiry: 'Approved policy nears expiry',
}

const cooldownOptions = [60, 360, 720, 1440, 10080]

function cooldownLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${minutes / 60} hr`
  const days = minutes / 1440
  return `${days} day${days === 1 ? '' : 's'}`
}

function runStatusLabel(status: AutomationRun['status']) {
  return status.replaceAll('_', ' ')
}

function formatAutomationTime(value: string) {
  if (!value) return 'Not run yet'
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AutomationCenter({ userName, onAuditEvent }: AutomationCenterProps) {
  const [state, setState] = useState<AutomationState>(emptyAutomationState)
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [syncMessage, setSyncMessage] = useState('Loading persistent automation controls.')
  const [errorMessage, setErrorMessage] = useState('')

  const pendingRuns = useMemo(
    () => state.runs.filter((run) => run.status === 'awaiting_approval'),
    [state.runs],
  )

  useEffect(() => {
    let mounted = true
    fetchAutomationState()
      .then((payload) => {
        if (!mounted) return
        setState(payload)
        setSyncMessage('SQLite automation engine connected.')
      })
      .catch((error) => {
        if (!mounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Automation controls could not be loaded.')
        setSyncMessage('Automation backend unavailable.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const refresh = async () => {
    setBusyAction('refresh')
    setErrorMessage('')
    try {
      setState(await fetchAutomationState())
      setSyncMessage('Automation state refreshed from SQLite.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation state could not be refreshed.')
    } finally {
      setBusyAction('')
    }
  }

  const runRules = async (ruleId?: string) => {
    const actionId = ruleId ? `run-${ruleId}` : 'run-all'
    setBusyAction(actionId)
    setErrorMessage('')
    try {
      const response = await runAutomationsOnServer(ruleId)
      setState(response.state)
      onAuditEvent(response.auditEvent)
      const awaiting = response.runs?.filter((run) => run.status === 'awaiting_approval').length ?? 0
      const deduplicated = response.runs?.filter((run) => run.deduplicated).length ?? 0
      setSyncMessage(
        `${response.runs?.length ?? 0} automation rule${response.runs?.length === 1 ? '' : 's'} checked${awaiting ? `; ${awaiting} waiting for approval` : ''}${deduplicated ? `; ${deduplicated} duplicate execution${deduplicated === 1 ? '' : 's'} safely suppressed` : ''}.`,
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation rules could not be run.')
    } finally {
      setBusyAction('')
    }
  }

  const updateRule = async (
    rule: AutomationRule,
    changes: Partial<Pick<AutomationRule, 'enabled' | 'approvalRequired' | 'cooldownMinutes'>>,
  ) => {
    setBusyAction(`update-${rule.id}`)
    setErrorMessage('')
    try {
      const response = await updateAutomationRuleOnServer(rule.id, changes)
      setState(response.state)
      onAuditEvent(response.auditEvent)
      setSyncMessage(`${response.rule?.name ?? rule.name} updated.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation rule could not be updated.')
    } finally {
      setBusyAction('')
    }
  }

  const decideRun = async (run: AutomationRun, decision: 'approve' | 'reject') => {
    setBusyAction(`${decision}-${run.id}`)
    setErrorMessage('')
    try {
      const response = await decideAutomationRunOnServer(run.id, decision)
      setState(response.state)
      onAuditEvent(response.auditEvent)
      setSyncMessage(`${run.ruleName} ${decision === 'approve' ? 'approved and released' : 'rejected safely'}.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation decision could not be saved.')
    } finally {
      setBusyAction('')
    }
  }

  const retryRun = async (run: AutomationRun) => {
    setBusyAction(`retry-${run.id}`)
    setErrorMessage('')
    try {
      const response = await retryAutomationRunOnServer(run.id)
      setState(response.state)
      onAuditEvent(response.auditEvent)
      setSyncMessage(`${run.ruleName} retry completed.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation retry could not be completed.')
    } finally {
      setBusyAction('')
    }
  }

  const markRead = async (notificationId: string) => {
    setBusyAction(`read-${notificationId}`)
    setErrorMessage('')
    try {
      const response = await markAutomationNotificationReadOnServer(notificationId)
      setState(response.state)
      setSyncMessage('Notification marked as read.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Notification could not be updated.')
    } finally {
      setBusyAction('')
    }
  }

  const reset = async () => {
    setBusyAction('reset')
    setErrorMessage('')
    try {
      const response = await resetAutomationOnServer()
      setState(response)
      onAuditEvent(response.auditEvent)
      setSyncMessage('Automation controls reset to safe college defaults.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Automation controls could not be reset.')
    } finally {
      setBusyAction('')
    }
  }

  if (loading) {
    return (
      <section className="automation-loading">
        <Zap size={20} />
        <strong>Loading Automation Control</strong>
        <span>Preparing rules, runs, approvals, and notifications.</span>
      </section>
    )
  }

  return (
    <section className="automation-center">
      <div className="automation-header">
        <div>
          <span className="panel-kicker">Operational automation</span>
          <h2>Automation Control</h2>
          <p>Run live college checks, keep high-impact actions behind approval, and suppress duplicate notifications.</p>
          <div className="automation-sync-line">
            <span>SQLite engine</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="automation-header-actions">
          <button type="button" className="secondary-action" onClick={refresh} disabled={Boolean(busyAction)}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button type="button" className="secondary-action" onClick={reset} disabled={Boolean(busyAction)}>
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
          <button type="button" className="primary-action" onClick={() => runRules()} disabled={Boolean(busyAction)}>
            <Play size={15} />
            <span>{busyAction === 'run-all' ? 'Checking...' : 'Run enabled rules'}</span>
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="automation-error" role="alert">
          <XCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="automation-kpis">
        <article>
          <Zap size={18} />
          <span>Enabled rules</span>
          <strong>{state.summary.enabledRules}/{state.summary.rules}</strong>
        </article>
        <article>
          <Activity size={18} />
          <span>Runs today</span>
          <strong>{state.summary.runsToday}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Awaiting approval</span>
          <strong>{state.summary.awaitingApproval}</strong>
        </article>
        <article>
          <BellRing size={18} />
          <span>Unread notifications</span>
          <strong>{state.summary.unreadNotifications}</strong>
        </article>
      </div>

      <div className="automation-layout">
        <section className="panel automation-rules-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Trigger / condition / action</span>
              <h2>Automation rules</h2>
            </div>
            <Zap size={20} />
          </div>
          <div className="automation-rule-list">
            {state.rules.map((rule) => (
              <article key={rule.id} className={clsx('automation-rule', !rule.enabled && 'is-paused')}>
                <div className="automation-rule-main">
                  <div>
                    <span>{rule.category}</span>
                    <strong>{rule.name}</strong>
                  </div>
                  <button
                    type="button"
                    className={clsx('automation-power', rule.enabled && 'is-enabled')}
                    aria-label={`${rule.enabled ? 'Pause' : 'Enable'} ${rule.name}`}
                    aria-pressed={rule.enabled}
                    disabled={Boolean(busyAction)}
                    onClick={() => updateRule(rule, { enabled: !rule.enabled })}
                  >
                    {rule.enabled ? <Play size={14} /> : <Pause size={14} />}
                    <span>{rule.enabled ? 'Enabled' : 'Paused'}</span>
                  </button>
                </div>
                <p>{rule.description}</p>
                <div className="automation-rule-flow">
                  <span><Clock3 size={13} /> When: {triggerLabels[rule.triggerType]}</span>
                  <span><BellRing size={13} /> Then: notify the signal owner</span>
                </div>
                <div className="automation-rule-controls">
                  <label>
                    Cooldown
                    <select
                      value={rule.cooldownMinutes}
                      disabled={Boolean(busyAction)}
                      onChange={(event) => updateRule(rule, { cooldownMinutes: Number(event.target.value) })}
                    >
                      {cooldownOptions.map((minutes) => (
                        <option key={minutes} value={minutes}>{cooldownLabel(minutes)}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className={clsx('automation-gate', rule.approvalRequired && 'is-required')}
                    aria-pressed={rule.approvalRequired}
                    disabled={Boolean(busyAction)}
                    onClick={() => updateRule(rule, { approvalRequired: !rule.approvalRequired })}
                  >
                    <ShieldCheck size={14} />
                    <span>{rule.approvalRequired ? 'Approval required' : 'Auto-release'}</span>
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    disabled={!rule.enabled || Boolean(busyAction)}
                    onClick={() => runRules(rule.id)}
                  >
                    <Play size={14} />
                    <span>{busyAction === `run-${rule.id}` ? 'Checking...' : 'Run now'}</span>
                  </button>
                </div>
                <small>
                  {rule.lastRun
                    ? `Last run ${formatAutomationTime(rule.lastRun.startedAt)} / ${runStatusLabel(rule.lastRun.status)}`
                    : 'No run recorded yet'}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel automation-approval-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Human safety gate</span>
              <h2>Approval queue</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          {pendingRuns.length === 0 ? (
            <div className="automation-empty">
              <CheckCircle2 size={20} />
              <strong>No approval is waiting</strong>
              <span>Guarded automation runs will appear here before notifications are released.</span>
            </div>
          ) : (
            <div className="automation-approval-list">
              {pendingRuns.map((run) => (
                <article key={run.id}>
                  <span>{run.category} / {run.matchCount} signals</span>
                  <strong>{run.ruleName}</strong>
                  <p>{run.summary}</p>
                  <small>Started by {run.startedBy} / {formatAutomationTime(run.startedAt)}</small>
                  <div>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={Boolean(busyAction)}
                      onClick={() => decideRun(run, 'approve')}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      className="secondary-action"
                      disabled={Boolean(busyAction)}
                      onClick={() => decideRun(run, 'reject')}
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel automation-runs-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Idempotent execution history</span>
              <h2>Recent runs</h2>
            </div>
            <Activity size={20} />
          </div>
          {state.runs.length === 0 ? (
            <div className="automation-empty">
              <Activity size={20} />
              <strong>No automation has run yet</strong>
              <span>Run one rule or all enabled rules to evaluate live college signals.</span>
            </div>
          ) : (
            <div className="automation-run-list">
              {state.runs.slice(0, 12).map((run) => (
                <article key={run.id} className={`is-${run.status}`}>
                  <span className="automation-run-icon">
                    {run.status === 'failed' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                  </span>
                  <div>
                    <strong>{run.ruleName}</strong>
                    <p>{run.summary}</p>
                    <small>{formatAutomationTime(run.startedAt)} / attempt {run.attempt} / {run.notificationCount} notifications</small>
                  </div>
                  <span className="automation-status">{runStatusLabel(run.status)}</span>
                  {run.status === 'failed' ? (
                    <button
                      type="button"
                      className="secondary-action"
                      disabled={Boolean(busyAction)}
                      onClick={() => retryRun(run)}
                    >
                      <RotateCcw size={13} />
                      <span>Retry</span>
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel automation-notifications-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Delivery outbox</span>
              <h2>In-app notifications</h2>
            </div>
            <BellRing size={20} />
          </div>
          {state.notifications.length === 0 ? (
            <div className="automation-empty">
              <BellRing size={20} />
              <strong>No notifications released</strong>
              <span>Completed automations create grouped messages here without sending duplicates.</span>
            </div>
          ) : (
            <div className="automation-notification-list">
              {state.notifications.slice(0, 12).map((notification) => (
                <article key={notification.id} className={clsx(notification.status === 'read' && 'is-read')}>
                  <BellRing size={16} />
                  <div>
                    <span>{notification.recipient} / {notification.channel.replace('_', ' ')}</span>
                    <strong>{notification.subject}</strong>
                    <p>{notification.message}</p>
                    <small>{formatAutomationTime(notification.sentAt || notification.createdAt)}</small>
                  </div>
                  {notification.status === 'sent' ? (
                    <button
                      type="button"
                      className="secondary-action"
                      disabled={Boolean(busyAction)}
                      onClick={() => markRead(notification.id)}
                    >
                      <Check size={13} />
                      <span>Mark read</span>
                    </button>
                  ) : (
                    <span className="automation-read-status">Read</span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="automation-footer-note">
        <ShieldCheck size={15} />
        <span>{userName} can pause rules, change cooldowns, and approve guarded runs. Automation never changes academic or financial records directly.</span>
      </footer>
    </section>
  )
}
