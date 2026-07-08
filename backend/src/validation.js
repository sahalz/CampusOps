export const masterDataStatuses = new Set(['active', 'inactive'])
export const subjectKinds = new Set(['theory', 'lab', 'elective'])

export function normalizeValue(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function slugify(value) {
  return normalizeValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function cleanDepartment(input) {
  return {
    name: String(input?.name ?? '').trim().replace(/\s+/g, ' '),
    code: String(input?.code ?? '').trim().toUpperCase().replace(/\s+/g, ''),
    facultyInCharge: String(input?.facultyInCharge ?? '').trim().replace(/\s+/g, ' '),
    officeRoom: String(input?.officeRoom ?? '').trim().replace(/\s+/g, ' '),
    status: masterDataStatuses.has(input?.status) ? input.status : 'active',
  }
}

export function cleanSubject(input) {
  return {
    departmentId: String(input?.departmentId ?? '').trim(),
    semester: Number(input?.semester),
    code: String(input?.code ?? '').trim().toUpperCase().replace(/\s+/g, ''),
    name: String(input?.name ?? '').trim().replace(/\s+/g, ' '),
    credits: Number(input?.credits),
    kind: subjectKinds.has(input?.kind) ? input.kind : 'theory',
    defaultFaculty: String(input?.defaultFaculty ?? '').trim().replace(/\s+/g, ' '),
    status: masterDataStatuses.has(input?.status) ? input.status : 'active',
  }
}

export function validateDepartmentDraft(draft, departments, editingDepartmentId) {
  const errors = []
  const normalizedName = normalizeValue(draft.name)
  const normalizedCode = normalizeValue(draft.code)

  if (draft.name.length < 3) {
    errors.push('Department name must be at least 3 characters.')
  }

  if (!/^[a-z0-9]{2,10}$/i.test(draft.code)) {
    errors.push('Department code must be 2 to 10 letters or numbers.')
  }

  if (draft.facultyInCharge.length < 3) {
    errors.push('HOD or faculty in charge is required.')
  }

  if (draft.officeRoom.length < 2) {
    errors.push('Office or room is required.')
  }

  if (
    departments.some(
      (department) => department.id !== editingDepartmentId && normalizeValue(department.name) === normalizedName,
    )
  ) {
    errors.push('A department with this name already exists.')
  }

  if (
    departments.some(
      (department) => department.id !== editingDepartmentId && normalizeValue(department.code) === normalizedCode,
    )
  ) {
    errors.push('A department with this code already exists.')
  }

  return errors
}

export function validateSubjectDraft(draft, departments, subjects, editingSubjectId) {
  const errors = []
  const normalizedCode = normalizeValue(draft.code)

  if (!departments.some((department) => department.id === draft.departmentId)) {
    errors.push('Select a valid department.')
  }

  if (!Number.isInteger(draft.semester) || draft.semester < 1 || draft.semester > 8) {
    errors.push('Semester must be between 1 and 8.')
  }

  if (!/^[a-z0-9]{2,12}$/i.test(draft.code)) {
    errors.push('Subject code must be 2 to 12 letters or numbers.')
  }

  if (draft.name.length < 3) {
    errors.push('Subject name must be at least 3 characters.')
  }

  if (!Number.isInteger(draft.credits) || draft.credits < 0 || draft.credits > 6) {
    errors.push('Credits must be a whole number from 0 to 6.')
  }

  if (draft.defaultFaculty.length < 3) {
    errors.push('Default faculty is required.')
  }

  if (subjects.some((subject) => subject.id !== editingSubjectId && normalizeValue(subject.code) === normalizedCode)) {
    errors.push('A subject with this code already exists.')
  }

  return errors
}
