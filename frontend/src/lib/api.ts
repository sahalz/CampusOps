import type {
  AttendanceRecord,
  AuditEvent,
  ClassSection,
  Circular,
  CircularReadReceipt,
  CircularState,
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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

function isErrorPayload(value: unknown): value is ErrorPayload {
  return Boolean(value && typeof value === 'object')
}

async function requestJson<T>(path: string, init?: RequestInit, timeoutMs = 2500): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
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
