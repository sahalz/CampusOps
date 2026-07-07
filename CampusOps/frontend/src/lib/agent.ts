import type { AuditEvent, KnowledgeDoc, RouteResult, RiskLevel, WorkflowTemplate } from '../types'

const riskyPatterns = [
  'ignore previous',
  'bypass approval',
  'without approval',
  'delete records',
  'send all',
  'password',
  'private',
  'confidential',
  'bank',
  'payment',
  'transfer',
]

const tokenise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

const riskWeight: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

export function routeCampusRequest(
  input: string,
  workflows: WorkflowTemplate[],
  docs: KnowledgeDoc[],
): RouteResult {
  const query = input.trim()
  const tokens = tokenise(query)
  const fallbackWorkflow = workflows[0]

  const scoredWorkflows = workflows
    .map((workflow) => {
      const keywordScore = workflow.keywords.reduce(
        (score, keyword) => score + (query.toLowerCase().includes(keyword) ? 4 : 0),
        0,
      )
      const tagScore = workflow.tags.reduce((score, tag) => score + (tokens.includes(tag) ? 2 : 0), 0)
      const titleScore = workflow.title
        .toLowerCase()
        .split(' ')
        .reduce((score, word) => score + (tokens.includes(word) ? 2 : 0), 0)

      return {
        workflow,
        score: keywordScore + tagScore + titleScore + workflow.automationRate / 100,
      }
    })
    .sort((first, second) => second.score - first.score)

  const selectedWorkflow = scoredWorkflows[0]?.score > 0 ? scoredWorkflows[0].workflow : fallbackWorkflow

  const matchedDocs = docs
    .map((doc) => {
      const tagMatches = doc.tags.filter((tag) => tokens.includes(tag) || query.toLowerCase().includes(tag))
      const workflowMatches = doc.tags.filter((tag) => selectedWorkflow.tags.includes(tag))
      return {
        doc,
        score: tagMatches.length * 3 + workflowMatches.length * 2 + doc.coverage / 100,
      }
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map(({ doc }) => doc)

  const flags = riskyPatterns.filter((pattern) => query.toLowerCase().includes(pattern))
  const highImpact =
    selectedWorkflow.risk === 'high' ||
    flags.some((flag) => ['bypass approval', 'without approval', 'delete records', 'payment', 'transfer'].includes(flag))

  const safetyLevel: RiskLevel = flags.length > 1 || highImpact ? 'high' : flags.length === 1 ? 'medium' : selectedWorkflow.risk
  const requiredApproval = safetyLevel !== 'low' || selectedWorkflow.steps.some((step) => step.status === 'human')
  const matchScore = Math.max(scoredWorkflows[0]?.score ?? 0, 1)
  const confidence = Math.min(98, Math.round(54 + matchScore * 7 + matchedDocs.length * 5 - riskWeight[safetyLevel] * 2))

  const plan = selectedWorkflow.steps.map((step, index) => `${index + 1}. ${step.label}`)
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const trace: AuditEvent[] = [
    {
      id: `TRACE-${Date.now()}-1`,
      time,
      actor: 'AI Router',
      action: 'Selected workflow',
      outcome: `${selectedWorkflow.title} with ${confidence} percent confidence.`,
      severity: confidence >= 80 ? 'success' : 'warning',
    },
    {
      id: `TRACE-${Date.now()}-2`,
      time,
      actor: 'RAG Retriever',
      action: 'Fetched references',
      outcome: `${matchedDocs.length} source documents prepared for response grounding.`,
      severity: 'info',
    },
    {
      id: `TRACE-${Date.now()}-3`,
      time,
      actor: 'Policy Guard',
      action: requiredApproval ? 'Queued approval' : 'Allowed automation',
      outcome:
        flags.length > 0
          ? `Detected risk flags: ${flags.join(', ')}.`
          : `${selectedWorkflow.risk.toUpperCase()} workflow risk applied.`,
      severity: safetyLevel === 'high' ? 'critical' : safetyLevel === 'medium' ? 'warning' : 'success',
    },
  ]

  return {
    workflowId: selectedWorkflow.id,
    confidence,
    summary: query || 'New request needs classification before workflow execution.',
    routeReason: `Matched ${selectedWorkflow.title} using keywords, workflow tags, and knowledge coverage.`,
    requiredApproval,
    retrievedDocs: matchedDocs,
    safety: {
      level: safetyLevel,
      verdict: requiredApproval ? 'Human approval required before any external action.' : 'Automation allowed with audit logging.',
      flags,
    },
    plan,
    trace,
  }
}
