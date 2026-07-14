import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  Users,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import {
  createKnowledgeDocumentOnServer,
  fetchKnowledgeState,
  resetKnowledgeOnServer,
  runKnowledgeEvaluationOnServer,
  searchKnowledgeOnServer,
} from '../../lib/api'
import { extractKnowledgePdf, type KnowledgePdfPage } from '../../lib/pdfKnowledge'
import type {
  AuditEvent,
  KnowledgeEvaluationPayload,
  KnowledgeSearchPayload,
  KnowledgeState,
  Role,
} from '../../types'

type KnowledgeCenterProps = {
  currentRole: Role
  userName: string
  onAuditEvent: (event: AuditEvent, persist?: boolean) => void
}

const emptyState: KnowledgeState = {
  version: 2,
  source: 'sqlite',
  documents: [],
  stats: {
    documents: 0,
    activeDocuments: 0,
    chunks: 0,
    restrictedDocuments: 0,
    pdfDocuments: 0,
  },
}

const sampleQuestions = [
  'What is the minimum attendance requirement?',
  'Who approves medical leave for a period?',
  'When should circular unread counts be escalated?',
]

function cleanTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
}

function shortDate(value: string) {
  if (!value) {
    return 'Not synced'
  }

  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function KnowledgeCenter({ currentRole, userName, onAuditEvent }: KnowledgeCenterProps) {
  const [state, setState] = useState<KnowledgeState>(emptyState)
  const [query, setQuery] = useState(sampleQuestions[0])
  const [result, setResult] = useState<KnowledgeSearchPayload | null>(null)
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('Uploaded policy')
  const [owner, setOwner] = useState(userName)
  const [tags, setTags] = useState('attendance, leave')
  const [body, setBody] = useState('')
  const [pages, setPages] = useState<KnowledgePdfPage[]>([])
  const [pageCount, setPageCount] = useState(1)
  const [documentFormat, setDocumentFormat] = useState<'text' | 'pdf'>('text')
  const [audience, setAudience] = useState<'everyone' | 'students' | 'faculty' | 'admin'>('everyone')
  const [versionLabel, setVersionLabel] = useState('1.0')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [fileInsight, setFileInsight] = useState('Paste approved text or load a text-based PDF.')
  const [evaluation, setEvaluation] = useState<KnowledgeEvaluationPayload | null>(null)
  const [syncStatus, setSyncStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Loading SQLite knowledge base.')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isAdmin = currentRole === 'admin'

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>()
    state.documents.forEach((document) => {
      document.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    })
    return [...counts.entries()].sort((first, second) => second[1] - first[1]).slice(0, 8)
  }, [state.documents])

  useEffect(() => {
    let mounted = true

    fetchKnowledgeState()
      .then((payload) => {
        if (!mounted) {
          return
        }
        setState(payload)
        setSyncStatus('connected')
        setSyncMessage('SQLite RAG knowledge base connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setSyncStatus('offline')
        setSyncMessage('Knowledge backend unavailable.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const runSearch = async (nextQuery = query) => {
    const cleanQuery = nextQuery.trim()
    if (!cleanQuery) {
      return
    }

    setQuery(cleanQuery)
    setIsSearching(true)
    setSyncStatus((currentStatus) => (currentStatus === 'offline' ? 'offline' : 'checking'))
    setSyncMessage('Searching policy chunks.')

    try {
      const payload = await searchKnowledgeOnServer(cleanQuery)
      setResult(payload)
      setSyncStatus('connected')
      setSyncMessage(`${payload.citations.length} citations retrieved from SQLite.`)
    } catch {
      setSyncStatus('offline')
      setSyncMessage('Knowledge search failed.')
    } finally {
      setIsSearching(false)
    }
  }

  const saveDocument = async () => {
    if (!isAdmin || body.trim().length < 40 || title.trim().length < 3) {
      return
    }

    setIsSaving(true)
    setSyncStatus('checking')
    setSyncMessage('Chunking and saving policy document.')

    try {
      const payload = await createKnowledgeDocumentOnServer({
        title,
        source,
        owner,
        tags: cleanTags(tags),
        body,
        pages: pages.length > 0 ? pages : undefined,
        pageCount,
        audience,
        versionLabel,
        effectiveAt: effectiveAt || undefined,
        expiresAt: expiresAt || undefined,
        format: documentFormat,
      })
      setState(payload.state)
      onAuditEvent(payload.auditEvent, false)
      setTitle('')
      setBody('')
      setPages([])
      setPageCount(1)
      setDocumentFormat('text')
      setVersionLabel('1.0')
      setEffectiveAt('')
      setExpiresAt('')
      setFileInsight('Paste approved text or load a text-based PDF.')
      setSyncStatus('connected')
      setSyncMessage('Document added to SQLite RAG search.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      setSyncStatus('offline')
      setSyncMessage('Document could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetKnowledge = async () => {
    if (!isAdmin) {
      return
    }

    setIsSaving(true)
    setSyncStatus('checking')
    setSyncMessage('Resetting policy knowledge base.')

    try {
      const payload = await resetKnowledgeOnServer()
      setState(payload)
      onAuditEvent(payload.auditEvent, false)
      setSyncStatus('connected')
      setSyncMessage('Knowledge base reset to default policy documents.')
    } catch {
      setSyncStatus('offline')
      setSyncMessage('Knowledge reset failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setSyncStatus('checking')
    setSyncMessage('Reading policy document and preserving page citations.')

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      setTitle((currentTitle) => currentTitle || file.name.replace(/\.[^.]+$/, ''))
      setSource(file.name)

      if (isPdf) {
        const extracted = await extractKnowledgePdf(new Uint8Array(await file.arrayBuffer()))
        setPages(extracted.pages)
        setPageCount(extracted.pageCount)
        setDocumentFormat('pdf')
        setBody(extracted.pages.map((page) => `# Page ${page.pageNumber}\n${page.text}`).join('\n\n'))
        setFileInsight(`${extracted.pageCount} PDF pages / ${extracted.wordCount} words / page citations ready`)
        setSyncMessage('PDF text extracted with page-level citation metadata.')
      } else {
        const text = await file.text()
        setPages([])
        setPageCount(1)
        setDocumentFormat('text')
        setBody(text)
        setFileInsight(`${text.split(/\s+/).filter(Boolean).length} words loaded from ${file.name}`)
        setSyncMessage('Text document loaded for section-aware chunking.')
      }
      setSyncStatus('connected')
    } catch (error) {
      setPages([])
      setPageCount(1)
      setBody('')
      setDocumentFormat('text')
      setSyncStatus('offline')
      setSyncMessage(error instanceof Error ? error.message : 'Policy document could not be read.')
    }
  }

  const runEvaluation = async () => {
    if (!isAdmin) {
      return
    }
    setIsEvaluating(true)
    setSyncStatus('checking')
    setSyncMessage('Running approved RAG retrieval and citation checks.')
    try {
      const payload = await runKnowledgeEvaluationOnServer()
      setEvaluation(payload)
      setSyncStatus('connected')
      setSyncMessage(`${payload.passed} of ${payload.total} RAG evaluation questions passed.`)
    } catch {
      setSyncStatus('offline')
      setSyncMessage('RAG evaluation could not be completed.')
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <section className="knowledge-center">
      <div className="knowledge-header">
        <div>
          <span className="eyebrow">Policy RAG</span>
          <h2>Hybrid policy knowledge</h2>
          <p>Search current, role-visible college policies with FTS5 ranking, related-concept matching, and page-level citations.</p>
          <div className={clsx('master-sync-chip', `is-${syncStatus}`)}>
            <span>{syncStatus === 'connected' ? 'SQLite backend' : syncStatus === 'checking' ? 'Checking RAG' : 'Needs attention'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="knowledge-health">
          <Database size={18} />
          <strong>{state.stats.chunks}</strong>
          <span>searchable chunks</span>
        </div>
      </div>

      <div className="knowledge-kpis">
        <article>
          <BookOpenCheck size={18} />
          <span>Documents</span>
          <strong>{state.stats.documents}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Active sources</span>
          <strong>{state.stats.activeDocuments}</strong>
        </article>
        <article>
          <FileText size={18} />
          <span>PDF sources</span>
          <strong>{state.stats.pdfDocuments}</strong>
        </article>
        <article>
          <Search size={18} />
          <span>Confidence</span>
          <strong>{result ? `${result.confidence}%` : '-'}</strong>
        </article>
      </div>

      <div className={clsx('knowledge-layout', isAdmin && 'knowledge-layout--admin')}>
        <section className="panel knowledge-ask-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Ask CampusOps</span>
              <h2>Grounded answer</h2>
            </div>
            <Search size={20} />
          </div>
          <div className="knowledge-question-row">
            <label>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void runSearch()
                  }
                }}
                placeholder="Ask a policy question"
                aria-label="Ask a policy question"
              />
            </label>
            <button type="button" className="primary-action" disabled={isSearching} onClick={() => void runSearch()}>
              <Search size={16} />
              <span>{isSearching ? 'Searching' : 'Search'}</span>
            </button>
          </div>
          <div className="knowledge-samples">
            {sampleQuestions.map((question) => (
              <button key={question} type="button" onClick={() => void runSearch(question)}>
                {question}
              </button>
            ))}
          </div>
          <div className="knowledge-retrieval-note">
            <ShieldCheck size={15} />
            <span>{currentRole} visibility applied before retrieval</span>
            <em>SQLite FTS5 + concepts</em>
          </div>

          {result ? (
            <div className="knowledge-answer">
              <strong>{result.grounded ? 'Grounded answer from current policies' : 'Safe refusal - no evidence'}</strong>
              <p>{result.answer}</p>
              {result.warnings.map((warning) => <small key={warning}>{warning}</small>)}
            </div>
          ) : (
            <div className="empty-state empty-state--boxed">
              <Search size={18} />
              <span>Ask a question to retrieve source-backed policy citations.</span>
            </div>
          )}

          {result?.citations.length ? (
            <div className="knowledge-citation-list">
              {result.citations.map((citation) => (
                <article key={citation.id} className="knowledge-citation">
                  <div>
                    <strong>{citation.heading}</strong>
                    <span>{citation.title} / {citation.source} / page {citation.pageNumber} / version {citation.versionLabel}</span>
                  </div>
                  <p>{citation.snippet}</p>
                  <div>
                    {citation.matchReasons.map((reason) => <em key={reason} className="is-match">{reason}</em>)}
                    {citation.tags.slice(0, 5).map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {isAdmin ? (
          <section className="panel knowledge-editor-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Admin upload</span>
                <h2>Add approved policy</h2>
              </div>
              <UploadCloud size={20} />
            </div>
            <div className="knowledge-editor-form">
              <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Attendance policy" />
              </label>
              <label>
                Source
                <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Academic handbook" />
              </label>
              <label>
                Owner
                <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Academic Office" />
              </label>
              <label>
                Tags
                <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="attendance, leave" />
              </label>
              <label>
                Visible to
                <select value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}>
                  <option value="everyone">Everyone</option>
                  <option value="students">Students only</option>
                  <option value="faculty">Faculty only</option>
                  <option value="admin">Administration only</option>
                </select>
              </label>
              <label>
                Version
                <input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="1.0" />
              </label>
              <label>
                Effective date
                <input type="date" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} />
              </label>
              <label>
                Expiry date
                <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </label>
              <label className="knowledge-body-field">
                Extracted policy text
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="# Section heading&#10;Paste policy text here."
                />
                <small>{fileInsight}</small>
              </label>
            </div>
            <div className="knowledge-editor-actions">
              <label className="secondary-action knowledge-file-upload">
                <UploadCloud size={15} />
                <span>Load PDF or text</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </label>
              <button type="button" className="secondary-action" disabled={isSaving} onClick={resetKnowledge}>
                <RefreshCw size={15} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                className="primary-action"
                disabled={isSaving || body.trim().length < 40 || title.trim().length < 3}
                onClick={saveDocument}
              >
                <Database size={16} />
                <span>{isSaving ? 'Saving' : 'Save document'}</span>
              </button>
            </div>
          </section>
        ) : null}

        <section className="panel knowledge-library-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Library</span>
              <h2>Policy sources</h2>
            </div>
            <BookOpenCheck size={20} />
          </div>
          {popularTags.length > 0 ? (
            <div className="knowledge-tag-strip">
              {popularTags.map(([tag, count]) => (
                <button key={tag} type="button" onClick={() => void runSearch(tag)}>
                  {tag} <span>{count}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="knowledge-document-list">
            {state.documents.map((document) => (
              <article key={document.id} className="knowledge-document-row">
                <div>
                  <strong>{document.title}</strong>
                  <span>{document.source} / {document.owner} / version {document.versionLabel}</span>
                </div>
                <small>{document.pageCount} pages / {document.chunkCount} chunks / {document.audience} / {document.lifecycle} / {shortDate(document.updatedAt)}</small>
                <div>
                  {document.tags.slice(0, 5).map((tag) => (
                    <em key={tag}>{tag}</em>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {isAdmin ? (
          <section className="panel knowledge-evaluation-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Measured quality</span>
                <h2>RAG evaluation</h2>
              </div>
              <button type="button" className="primary-action" disabled={isEvaluating} onClick={() => void runEvaluation()}>
                <ChartNoAxesColumnIncreasing size={16} />
                <span>{isEvaluating ? 'Running checks' : 'Run evaluation'}</span>
              </button>
            </div>
            {evaluation ? (
              <>
                <div className="knowledge-evaluation-kpis">
                  <article><Gauge size={18} /><span>Overall accuracy</span><strong>{evaluation.accuracy}%</strong></article>
                  <article><BookOpenCheck size={18} /><span>Citation accuracy</span><strong>{evaluation.citationAccuracy}%</strong></article>
                  <article><ShieldCheck size={18} /><span>Answer support</span><strong>{evaluation.answerSupport}%</strong></article>
                  <article><Users size={18} /><span>Checks passed</span><strong>{evaluation.passed}/{evaluation.total}</strong></article>
                </div>
                <div className="knowledge-evaluation-list">
                  {evaluation.cases.map((testCase) => (
                    <article key={testCase.id} className={clsx(testCase.passed ? 'is-passed' : 'is-failed')}>
                      {testCase.passed ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                      <div>
                        <strong>{testCase.question}</strong>
                        <span>{testCase.retrievedDocument} / {testCase.confidence}% confidence</span>
                      </div>
                      <em>{testCase.passed ? 'Passed' : 'Review'}</em>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state empty-state--boxed">
                <ChartNoAxesColumnIncreasing size={18} />
                <span>Run the approved question set to measure retrieval, citation correctness, and answer support.</span>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </section>
  )
}
