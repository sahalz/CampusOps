import type {
  AuditEvent,
  MasterDataStatus,
  MasterDepartment,
  MasterSubject,
  SubjectKind,
} from '../types'

export type MasterDataState = {
  version: 1
  departments: MasterDepartment[]
  subjects: MasterSubject[]
}

export type DepartmentDraft = Omit<MasterDepartment, 'id'>

export type SubjectDraft = Omit<MasterSubject, 'id'>

export const masterDataStorageKey = 'campusops-master-data-state-v1'

export const subjectKinds: SubjectKind[] = ['theory', 'lab', 'elective']

export const masterDataStatuses: MasterDataStatus[] = ['active', 'inactive']

export function normalizeMasterValue(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function slugifyMasterValue(value: string) {
  return normalizeMasterValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function makeMasterId(prefix: string, value: string) {
  const slug = slugifyMasterValue(value) || 'record'
  return `${prefix}-${slug}-${Date.now().toString(36)}`
}

export function readStoredMasterDataState(): MasterDataState | null {
  try {
    const raw = window.localStorage.getItem(masterDataStorageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<MasterDataState>
    if (parsed.version !== 1 || !Array.isArray(parsed.departments) || !Array.isArray(parsed.subjects)) {
      return null
    }

    return parsed as MasterDataState
  } catch {
    return null
  }
}

export function writeStoredMasterDataState(state: MasterDataState) {
  try {
    window.localStorage.setItem(masterDataStorageKey, JSON.stringify(state))
  } catch {
    // Master data remains available in-memory if localStorage is unavailable.
  }
}

export function clearStoredMasterDataState() {
  try {
    window.localStorage.removeItem(masterDataStorageKey)
  } catch {
    // In-memory reset still succeeds if storage cleanup fails.
  }
}

export function sanitizeDepartmentDraft(draft: DepartmentDraft): DepartmentDraft {
  return {
    name: draft.name.trim().replace(/\s+/g, ' '),
    code: draft.code.trim().toUpperCase().replace(/\s+/g, ''),
    facultyInCharge: draft.facultyInCharge.trim().replace(/\s+/g, ' '),
    officeRoom: draft.officeRoom.trim().replace(/\s+/g, ' '),
    status: draft.status,
  }
}

export function sanitizeSubjectDraft(draft: SubjectDraft): SubjectDraft {
  return {
    departmentId: draft.departmentId,
    semester: Number(draft.semester),
    code: draft.code.trim().toUpperCase().replace(/\s+/g, ''),
    name: draft.name.trim().replace(/\s+/g, ' '),
    credits: Number(draft.credits),
    kind: draft.kind,
    defaultFaculty: draft.defaultFaculty.trim().replace(/\s+/g, ' '),
    status: draft.status,
  }
}

export function validateDepartmentDraft(
  draft: DepartmentDraft,
  departments: MasterDepartment[],
  editingDepartmentId?: string,
) {
  const normalizedName = normalizeMasterValue(draft.name)
  const normalizedCode = normalizeMasterValue(draft.code)
  const errors: string[] = []

  if (draft.name.trim().length < 3) {
    errors.push('Department name must be at least 3 characters.')
  }

  if (!/^[a-z0-9]{2,10}$/i.test(draft.code.trim())) {
    errors.push('Department code must be 2 to 10 letters or numbers.')
  }

  if (draft.facultyInCharge.trim().length < 3) {
    errors.push('HOD or faculty in charge is required.')
  }

  if (draft.officeRoom.trim().length < 2) {
    errors.push('Office or room is required.')
  }

  const duplicateName = departments.some(
    (department) =>
      department.id !== editingDepartmentId && normalizeMasterValue(department.name) === normalizedName,
  )
  const duplicateCode = departments.some(
    (department) =>
      department.id !== editingDepartmentId && normalizeMasterValue(department.code) === normalizedCode,
  )

  if (duplicateName) {
    errors.push('A department with this name already exists.')
  }

  if (duplicateCode) {
    errors.push('A department with this code already exists.')
  }

  return errors
}

export function validateSubjectDraft(
  draft: SubjectDraft,
  departments: MasterDepartment[],
  subjects: MasterSubject[],
  editingSubjectId?: string,
) {
  const errors: string[] = []
  const normalizedCode = normalizeMasterValue(draft.code)

  if (!departments.some((department) => department.id === draft.departmentId)) {
    errors.push('Select a valid department.')
  }

  if (!Number.isInteger(Number(draft.semester)) || Number(draft.semester) < 1 || Number(draft.semester) > 8) {
    errors.push('Semester must be between 1 and 8.')
  }

  if (!/^[a-z0-9]{2,12}$/i.test(draft.code.trim())) {
    errors.push('Subject code must be 2 to 12 letters or numbers.')
  }

  if (draft.name.trim().length < 3) {
    errors.push('Subject name must be at least 3 characters.')
  }

  if (!Number.isInteger(Number(draft.credits)) || Number(draft.credits) < 0 || Number(draft.credits) > 6) {
    errors.push('Credits must be a whole number from 0 to 6.')
  }

  if (draft.defaultFaculty.trim().length < 3) {
    errors.push('Default faculty is required.')
  }

  const duplicateCode = subjects.some(
    (subject) => subject.id !== editingSubjectId && normalizeMasterValue(subject.code) === normalizedCode,
  )

  if (duplicateCode) {
    errors.push('A subject with this code already exists.')
  }

  return errors
}

export function summarizeMasterData(departments: MasterDepartment[], subjects: MasterSubject[]) {
  const activeDepartments = departments.filter((department) => department.status === 'active').length
  const activeSubjects = subjects.filter((subject) => subject.status === 'active').length
  const labSubjects = subjects.filter((subject) => subject.kind === 'lab').length
  const electiveSubjects = subjects.filter((subject) => subject.kind === 'elective').length

  return {
    departments: departments.length,
    activeDepartments,
    inactiveDepartments: departments.length - activeDepartments,
    subjects: subjects.length,
    activeSubjects,
    inactiveSubjects: subjects.length - activeSubjects,
    labSubjects,
    electiveSubjects,
  }
}

export function statusLabel(status: MasterDataStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function subjectKindLabel(kind: SubjectKind) {
  if (kind === 'lab') {
    return 'Lab'
  }

  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

export function makeMasterAudit(
  actor: string,
  action: string,
  outcome: string,
  severity: AuditEvent['severity'],
): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor,
    action,
    outcome,
    severity,
  }
}
