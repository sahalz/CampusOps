import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenCheck,
  Database,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import clsx from 'clsx'
import {
  createKnowledgeDocumentOnServer,
  fetchKnowledgeState,
  resetKnowledgeOnServer,
  searchKnowledgeOnServer,
} from '../../lib/api'
import type { AuditEvent, KnowledgeSearchPayload, KnowledgeState, Role } from '../../types'

type KnowledgeCenterProps = {
  currentRole: Role
  userName: string
  onAuditEvent: (event: AuditEvent, persist?: boolean) => void
}

const emptyState: KnowledgeState = {
  version: 1,
  source: 'sqlite',
  documents: [],
  stats: {
    documents: 0,
    activeDocuments: 0,
    chunks: 0,
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
  const [syncStatus, setSyncStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Loading SQLite knowledge base.')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
      })
      setState(payload.state)
      onAuditEvent(payload.auditEvent, false)
      setTitle('')
      setBody('')
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

    const text = await file.text()
    setTitle((currentTitle) => currentTitle || file.name.replace(/\.[^.]+$/, ''))
    setSource(file.name)
    setBody(text)
  }

  return (
    <section className="knowledge-center">
      <div className="knowledge-header">
        <div>
          <span className="eyebrow">Policy RAG</span>
          <h2>Policy knowledge and citations</h2>
          <p>Search college policy chunks and answer questions with source-backed citations.</p>
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
          <span>Citations</span>
          <strong>{result?.citations.length ?? 0}</strong>
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

          {result ? (
            <div className="knowledge-answer">
              <strong>{result.citations.length > 0 ? 'Answer from policy sources' : 'No citation found'}</strong>
              <p>{result.answer}</p>
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
                    <span>{citation.title} / {citation.source} / page {citation.pageNumber}</span>
                  </div>
                  <p>{citation.snippet}</p>
                  <div>
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
                <h2>Add policy text</h2>
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
              <label className="knowledge-body-field">
                Policy text
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="# Section heading&#10;Paste policy text here."
                />
              </label>
            </div>
            <div className="knowledge-editor-actions">
              <label className="secondary-action knowledge-file-upload">
                <UploadCloud size={15} />
                <span>Load text file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
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
                  <span>{document.source} / {document.owner}</span>
                </div>
                <small>{document.chunkCount} chunks / {shortDate(document.updatedAt)}</small>
                <div>
                  {document.tags.slice(0, 5).map((tag) => (
                    <em key={tag}>{tag}</em>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
