import type {
  AttendanceRecord,
  AuditEvent,
  ClassSection,
  LeaveRequest,
  MasterDepartment,
  MasterSubject,
  Student,
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
