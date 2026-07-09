import type {
  AttendanceRecord,
  AuthSession,
  AuditEvent,
  ClassSection,
  Circular,
  CircularReadReceipt,
  CircularState,
  ImportCommitPayload,
  ImportKind,
  ImportPreviewPayload,
  ImportSourceRow,
  KnowledgeSearchPayload,
  KnowledgeState,
  LeaveRequest,
  MasterDepartment,
  MasterSubject,
  ReportFilters,
  ReportsPayload,
  Student,
  StaffProfile,
  StaffState,
  Subject,
  Teacher,
  TimetableSlot,
  UserAccount,
} from '../types'
import type { DepartmentDraft, MasterDataState, SubjectDraft } from './masterData'

export type AcademicState = {
  version: 2
  classSections: ClassSection[]
  students: Student[]
  teachers: Teacher[]
  subjects: Subject[]
  slots: TimetableSlot[]
  attendance: AttendanceRecord[]
  leaves: LeaveRequest[]
}

type ErrorPayload = {
  error?: string
  errors?: string[]
}

type DepartmentResponse = {
  department: MasterDepartment
}

type SubjectResponse = {
  subject: MasterSubject
}

type AuditEventsResponse = {
  auditEvents: AuditEvent[]
}

type AuditEventResponse = {
  auditEvent: AuditEvent
}

type AuthUsersResponse = {
  users: UserAccount[]
}

type AuthSessionResponse = {
  session: AuthSession
}

type StaffProfileResponse = {
  staffProfile: StaffProfile
}

type CircularResponse = {
  circular: Circular
}

type CircularReadReceiptResponse = {
  readReceipt: CircularReadReceipt
}

type CircularReadReceiptsResponse = {
  readReceipts: CircularReadReceipt[]
}

type ReportActionInput = {
  actor: string
  action: string
  reportName: string
  outcome?: string
  severity?: AuditEvent['severity']
}

export type KnowledgeDocumentInput = {
  title: string
  source: string
  owner: string
  tags: string[]
  body: string
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
export const authSessionStorageKey = 'campusops-auth-session-v2'

function isErrorPayload(value: unknown): value is ErrorPayload {
  return Boolean(value && typeof value === 'object')
}

function readStoredAuthToken() {
  try {
    return window.localStorage.getItem(authSessionStorageKey)
  } catch {
    return null
  }
}

async function requestJson<T>(path: string, init?: RequestInit, timeoutMs = 2500): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const token = readStoredAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    })
    const payload = (await response.json().catch(() => ({}))) as unknown

    if (!response.ok) {
      const errorMessage = isErrorPayload(payload)
        ? payload.errors?.[0] ?? payload.error ?? 'Backend request failed.'
        : 'Backend request failed.'
      throw new Error(errorMessage)
    }

    return payload as T
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function fetchBackendHealth() {
  await requestJson('/health', undefined, 1200)
}

export async function fetchAuthUsers() {
  const response = await requestJson<AuthUsersResponse>('/auth/users')
  return response.users
}

export async function loginOnServer(accountId: string) {
  const response = await requestJson<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  })
  try {
    window.localStorage.setItem(authSessionStorageKey, response.session.token)
  } catch {
    // Session remains usable in-memory through the returned payload.
  }
  return response.session
}

export async function fetchCurrentAuthSession() {
  const response = await requestJson<AuthSessionResponse>('/auth/session')
  return response.session
}

export async function logoutOnServer() {
  const response = await requestJson<{ removed: boolean }>('/auth/logout', {
    method: 'POST',
  })
  try {
    window.localStorage.removeItem(authSessionStorageKey)
  } catch {
    // Ignore storage cleanup failure.
  }
  return response
}

export function fetchMasterDataState() {
  return requestJson<MasterDataState>('/master-data')
}

export async function createDepartmentOnServer(draft: DepartmentDraft) {
  const response = await requestJson<DepartmentResponse>('/departments', {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  return response.department
}

export async function updateDepartmentOnServer(id: string, draft: DepartmentDraft) {
  const response = await requestJson<DepartmentResponse>(`/departments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  })
  return response.department
}

export async function createSubjectOnServer(draft: SubjectDraft) {
  const response = await requestJson<SubjectResponse>('/subjects', {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  return response.subject
}

export async function updateSubjectOnServer(id: string, draft: SubjectDraft) {
  const response = await requestJson<SubjectResponse>(`/subjects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  })
  return response.subject
}

export function resetMasterDataOnServer() {
  return requestJson<MasterDataState>('/master-data/reset', {
    method: 'POST',
  })
}

export function fetchAcademicState() {
  return requestJson<AcademicState>('/academic-state')
}

export function saveAcademicStateOnServer(state: AcademicState) {
  return requestJson<AcademicState>('/academic-state', {
    method: 'PUT',
    body: JSON.stringify(state),
  })
}

export function resetAcademicStateOnServer() {
  return requestJson<AcademicState>('/academic-state/reset', {
    method: 'POST',
  })
}

export function fetchStaffState() {
  return requestJson<StaffState>('/staff-state')
}

export async function createStaffProfileOnServer(draft: Omit<StaffProfile, 'id' | 'teacherId'>) {
  const response = await requestJson<StaffProfileResponse>('/staff-profiles', {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  return response.staffProfile
}

export async function updateStaffProfileOnServer(id: string, draft: Omit<StaffProfile, 'id' | 'teacherId'>) {
  const response = await requestJson<StaffProfileResponse>(`/staff-profiles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  })
  return response.staffProfile
}

export function resetStaffStateOnServer() {
  return requestJson<StaffState>('/staff-state/reset', {
    method: 'POST',
  })
}

export function fetchCircularState() {
  return requestJson<CircularState>('/circular-state')
}

export async function createCircularOnServer(circular: Omit<Circular, 'id'> & Partial<Pick<Circular, 'id'>>) {
  const response = await requestJson<CircularResponse>('/circulars', {
    method: 'POST',
    body: JSON.stringify(circular),
  })
  return response.circular
}

export async function createCircularReadReceiptOnServer(receipt: CircularReadReceipt) {
  const response = await requestJson<CircularReadReceiptResponse>('/circular-read-receipts', {
    method: 'POST',
    body: JSON.stringify(receipt),
  })
  return response.readReceipt
}

export async function createCircularReadReceiptsOnServer(readReceipts: CircularReadReceipt[]) {
  const response = await requestJson<CircularReadReceiptsResponse>('/circular-read-receipts/bulk', {
    method: 'POST',
    body: JSON.stringify({ readReceipts }),
  })
  return response.readReceipts
}

export function resetCircularStateOnServer() {
  return requestJson<CircularState>('/circular-state/reset', {
    method: 'POST',
  })
}

export type ReportQuery = Partial<Pick<ReportFilters, 'department' | 'semester' | 'date' | 'status' | 'role' | 'actorId'>>

export function fetchReports(query: ReportQuery = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return requestJson<ReportsPayload>(`/reports${queryString ? `?${queryString}` : ''}`)
}

export async function recordReportActionOnServer(action: ReportActionInput) {
  const response = await requestJson<AuditEventResponse>('/reports/actions', {
    method: 'POST',
    body: JSON.stringify(action),
  })
  return response.auditEvent
}

export function previewImportOnServer(kind: ImportKind, rows: ImportSourceRow[]) {
  return requestJson<ImportPreviewPayload>(
    '/import/preview',
    {
      method: 'POST',
      body: JSON.stringify({ kind, rows }),
    },
    8000,
  )
}

export function commitImportOnServer(kind: ImportKind, rows: ImportSourceRow[]) {
  return requestJson<ImportCommitPayload>(
    '/import/commit',
    {
      method: 'POST',
      body: JSON.stringify({ kind, rows }),
    },
    12000,
  )
}

export function fetchKnowledgeState() {
  return requestJson<KnowledgeState>('/knowledge')
}

export function searchKnowledgeOnServer(query: string) {
  return requestJson<KnowledgeSearchPayload>(
    '/knowledge/search',
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    },
    8000,
  )
}

export function createKnowledgeDocumentOnServer(document: KnowledgeDocumentInput) {
  return requestJson<{ state: KnowledgeState; auditEvent: AuditEvent }>('/knowledge/documents', {
    method: 'POST',
    body: JSON.stringify(document),
  }, 10000)
}

export function resetKnowledgeOnServer() {
  return requestJson<KnowledgeState & { auditEvent: AuditEvent }>('/knowledge/reset', {
    method: 'POST',
  })
}

export async function fetchAuditEvents() {
  const response = await requestJson<AuditEventsResponse>('/audit-events')
  return response.auditEvents
}

export async function persistAuditEvent(event: AuditEvent) {
  const response = await requestJson<AuditEventResponse>('/audit-events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
  return response.auditEvent
}
