import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  GraduationCap,
  Plus,
  RefreshCw,
  School,
  Search,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'
import { teachers } from '../../data/academic'
import {
  masterDepartments as seededDepartments,
  masterSubjects as seededSubjects,
} from '../../data/masterData'
import {
  createDepartmentOnServer,
  createSubjectOnServer,
  fetchMasterDataState,
  resetMasterDataOnServer,
  updateDepartmentOnServer,
  updateSubjectOnServer,
} from '../../lib/api'
import {
  clearStoredMasterDataState,
  makeMasterAudit,
  makeMasterId,
  masterDataStatuses,
  normalizeMasterValue,
  readStoredMasterDataState,
  sanitizeDepartmentDraft,
  sanitizeSubjectDraft,
  statusLabel,
  subjectKindLabel,
  subjectKinds,
  summarizeMasterData,
  validateDepartmentDraft,
  validateSubjectDraft,
  writeStoredMasterDataState,
  type DepartmentDraft,
  type SubjectDraft,
} from '../../lib/masterData'
import type {
  AuditEvent,
  MasterDataStatus,
  MasterDepartment,
  MasterSubject,
  Role,
  SubjectKind,
} from '../../types'

type MasterDataCenterProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent) => void
}

const defaultDepartmentDraft: DepartmentDraft = {
  name: 'Artificial Intelligence and Data Science',
  code: 'AIDS',
  facultyInCharge: 'Dr. Maya Thomas',
  officeRoom: 'AI-101',
  status: 'active',
}

const defaultSubjectDraft: SubjectDraft = {
  departmentId: seededDepartments[0].id,
  semester: 5,
  code: 'CS505',
  name: 'Machine Learning',
  credits: 3,
  kind: 'elective',
  defaultFaculty: 'Prof. Anjali Rao',
  status: 'active',
}

function omitDepartmentId(department: MasterDepartment): DepartmentDraft {
  return {
    name: department.name,
    code: department.code,
    facultyInCharge: department.facultyInCharge,
    officeRoom: department.officeRoom,
    status: department.status,
  }
}

function omitSubjectId(subject: MasterSubject): SubjectDraft {
  return {
    departmentId: subject.departmentId,
    semester: subject.semester,
    code: subject.code,
    name: subject.name,
    credits: subject.credits,
    kind: subject.kind,
    defaultFaculty: subject.defaultFaculty,
    status: subject.status,
  }
}

function statusFilterLabel(status: MasterDataStatus | 'all') {
  return status === 'all' ? 'All status' : statusLabel(status)
}

export function MasterDataCenter({ currentRole, actorId, userName, onAuditEvent }: MasterDataCenterProps) {
  const [storedState] = useState(() => readStoredMasterDataState())
  const [departments, setDepartments] = useState<MasterDepartment[]>(
    () => storedState?.departments ?? seededDepartments,
  )
  const [subjects, setSubjects] = useState<MasterSubject[]>(() => storedState?.subjects ?? seededSubjects)
  const [departmentDraft, setDepartmentDraft] = useState<DepartmentDraft>(defaultDepartmentDraft)
  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft>(defaultSubjectDraft)
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [departmentQuery, setDepartmentQuery] = useState('')
  const [departmentStatusFilter, setDepartmentStatusFilter] = useState<MasterDataStatus | 'all'>('all')
  const [subjectQuery, setSubjectQuery] = useState('')
  const [subjectDepartmentFilter, setSubjectDepartmentFilter] = useState('all')
  const [subjectKindFilter, setSubjectKindFilter] = useState<SubjectKind | 'all'>('all')
  const [subjectStatusFilter, setSubjectStatusFilter] = useState<MasterDataStatus | 'all'>('all')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [syncMessage, setSyncMessage] = useState('Checking local backend.')
  const isAdmin = currentRole === 'admin'
  const currentTeacher = teachers.find((teacher) => teacher.id === actorId)

  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  )

  const facultyOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...teachers.map((teacher) => teacher.name),
          ...departments.map((department) => department.facultyInCharge),
          ...subjects.map((subject) => subject.defaultFaculty),
        ]),
      )
        .filter(Boolean)
        .sort(),
    [departments, subjects],
  )

  const stats = useMemo(() => summarizeMasterData(departments, subjects), [departments, subjects])

  const departmentErrors = useMemo(
    () => validateDepartmentDraft(departmentDraft, departments, editingDepartmentId ?? undefined),
    [departmentDraft, departments, editingDepartmentId],
  )

  const subjectErrors = useMemo(
    () => validateSubjectDraft(subjectDraft, departments, subjects, editingSubjectId ?? undefined),
    [departments, editingSubjectId, subjectDraft, subjects],
  )

  const visibleDepartments = useMemo(() => {
    const query = normalizeMasterValue(departmentQuery)
    return departments
      .filter((department) => departmentStatusFilter === 'all' || department.status === departmentStatusFilter)
      .filter(
        (department) =>
          !query ||
          normalizeMasterValue(department.name).includes(query) ||
          normalizeMasterValue(department.code).includes(query) ||
          normalizeMasterValue(department.facultyInCharge).includes(query) ||
          normalizeMasterValue(department.officeRoom).includes(query),
      )
      .sort(
        (first, second) =>
          first.status.localeCompare(second.status) ||
          first.name.localeCompare(second.name),
      )
  }, [departmentQuery, departmentStatusFilter, departments])

  const visibleSubjects = useMemo(() => {
    const query = normalizeMasterValue(subjectQuery)
    return subjects
      .filter((subject) => subjectDepartmentFilter === 'all' || subject.departmentId === subjectDepartmentFilter)
      .filter((subject) => subjectKindFilter === 'all' || subject.kind === subjectKindFilter)
      .filter((subject) => subjectStatusFilter === 'all' || subject.status === subjectStatusFilter)
      .filter((subject) => {
        const department = departmentById.get(subject.departmentId)
        return (
          !query ||
          normalizeMasterValue(subject.code).includes(query) ||
          normalizeMasterValue(subject.name).includes(query) ||
          normalizeMasterValue(subject.defaultFaculty).includes(query) ||
          normalizeMasterValue(department?.name ?? '').includes(query)
        )
      })
      .sort((first, second) => {
        const firstDepartment = departmentById.get(first.departmentId)?.name ?? ''
        const secondDepartment = departmentById.get(second.departmentId)?.name ?? ''
        return (
          firstDepartment.localeCompare(secondDepartment) ||
          first.semester - second.semester ||
          first.code.localeCompare(second.code)
        )
      })
  }, [
    departmentById,
    subjectDepartmentFilter,
    subjectKindFilter,
    subjectQuery,
    subjectStatusFilter,
    subjects,
  ])

  const facultyDepartment = useMemo(() => {
    const teacherDepartment = normalizeMasterValue(currentTeacher?.department ?? '')
    if (!teacherDepartment) {
      return undefined
    }

    return departments.find((department) => {
      const departmentName = normalizeMasterValue(department.name)
      return departmentName === teacherDepartment || departmentName.includes(teacherDepartment)
    })
  }, [currentTeacher?.department, departments])

  const assignedSubjects = useMemo(() => {
    const teacherName = normalizeMasterValue(currentTeacher?.name ?? userName)
    return subjects
      .filter((subject) => normalizeMasterValue(subject.defaultFaculty) === teacherName)
      .sort((first, second) => first.semester - second.semester || first.code.localeCompare(second.code))
  }, [currentTeacher?.name, subjects, userName])

  const facultyDepartmentSubjects = useMemo(
    () =>
      facultyDepartment
        ? subjects
            .filter((subject) => subject.departmentId === facultyDepartment.id && subject.status === 'active')
            .sort((first, second) => first.semester - second.semester || first.code.localeCompare(second.code))
        : [],
    [facultyDepartment, subjects],
  )

  useEffect(() => {
    writeStoredMasterDataState({
      version: 1,
      departments,
      subjects,
    })
  }, [departments, subjects])

  useEffect(() => {
    let mounted = true

    fetchMasterDataState()
      .then((state) => {
        if (!mounted) {
          return
        }

        setDepartments(state.departments)
        setSubjects(state.subjects)
        setBackendStatus('connected')
        setSyncMessage('SQLite backend connected.')
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setBackendStatus('offline')
        setSyncMessage('Backend offline; using browser backup.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const startNewDepartment = () => {
    setEditingDepartmentId(null)
    setDepartmentDraft(defaultDepartmentDraft)
  }

  const startNewSubject = () => {
    setEditingSubjectId(null)
    setSubjectDraft({
      ...defaultSubjectDraft,
      departmentId: departments[0]?.id ?? defaultSubjectDraft.departmentId,
    })
  }

  const loadDepartment = (department: MasterDepartment) => {
    setEditingDepartmentId(department.id)
    setDepartmentDraft(omitDepartmentId(department))
  }

  const loadSubject = (subject: MasterSubject) => {
    setEditingSubjectId(subject.id)
    setSubjectDraft(omitSubjectId(subject))
  }

  const saveDepartment = async () => {
    if (!isAdmin) {
      return
    }

    const sanitizedDraft = sanitizeDepartmentDraft(departmentDraft)
    const errors = validateDepartmentDraft(sanitizedDraft, departments, editingDepartmentId ?? undefined)
    if (errors.length > 0) {
      return
    }

    if (editingDepartmentId) {
      const existingDepartment = departments.find((department) => department.id === editingDepartmentId)
      let savedDepartment: MasterDepartment = existingDepartment
        ? {
            ...existingDepartment,
            ...sanitizedDraft,
          }
        : {
            id: editingDepartmentId,
            ...sanitizedDraft,
          }

      if (backendStatus === 'connected') {
        try {
          savedDepartment = await updateDepartmentOnServer(editingDepartmentId, sanitizedDraft)
          setSyncMessage('Department saved to SQLite backend.')
        } catch {
          setBackendStatus('offline')
          setSyncMessage('Backend save failed; department saved in browser backup.')
        }
      }

      setDepartments((currentDepartments) =>
        currentDepartments.map((department) =>
          department.id === editingDepartmentId
            ? savedDepartment
            : department,
        ),
      )
      setDepartmentDraft(omitDepartmentId(savedDepartment))
      onAuditEvent(
        makeMasterAudit(
          userName,
          'Updated department',
          `${sanitizedDraft.code} renamed or profile details updated.`,
          'success',
        ),
      )
      return
    }

    let department: MasterDepartment | null = null

    if (backendStatus === 'connected') {
      try {
        department = await createDepartmentOnServer(sanitizedDraft)
        setSyncMessage('Department saved to SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend save failed; department saved in browser backup.')
      }
    }

    department ??= {
      ...sanitizedDraft,
      id: makeMasterId('dept', sanitizedDraft.code || sanitizedDraft.name),
    }

    setDepartments((currentDepartments) => [...currentDepartments, department])
    setEditingDepartmentId(department.id)
    setDepartmentDraft(omitDepartmentId(department))
    onAuditEvent(
      makeMasterAudit(userName, 'Added department', `${department.name} (${department.code}) created.`, 'success'),
    )
  }

  const saveSubject = async () => {
    if (!isAdmin) {
      return
    }

    const sanitizedDraft = sanitizeSubjectDraft(subjectDraft)
    const errors = validateSubjectDraft(sanitizedDraft, departments, subjects, editingSubjectId ?? undefined)
    if (errors.length > 0) {
      return
    }

    if (editingSubjectId) {
      const existingSubject = subjects.find((subject) => subject.id === editingSubjectId)
      let savedSubject: MasterSubject = existingSubject
        ? {
            ...existingSubject,
            ...sanitizedDraft,
          }
        : {
            id: editingSubjectId,
            ...sanitizedDraft,
          }

      if (backendStatus === 'connected') {
        try {
          savedSubject = await updateSubjectOnServer(editingSubjectId, sanitizedDraft)
          setSyncMessage('Subject saved to SQLite backend.')
        } catch {
          setBackendStatus('offline')
          setSyncMessage('Backend save failed; subject saved in browser backup.')
        }
      }

      setSubjects((currentSubjects) =>
        currentSubjects.map((subject) =>
          subject.id === editingSubjectId
            ? savedSubject
            : subject,
        ),
      )
      setSubjectDraft(omitSubjectId(savedSubject))
      onAuditEvent(
        makeMasterAudit(
          userName,
          'Updated subject',
          `${sanitizedDraft.code} updated in the subject master.`,
          'success',
        ),
      )
      return
    }

    let subject: MasterSubject | null = null

    if (backendStatus === 'connected') {
      try {
        subject = await createSubjectOnServer(sanitizedDraft)
        setSyncMessage('Subject saved to SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend save failed; subject saved in browser backup.')
      }
    }

    subject ??= {
      ...sanitizedDraft,
      id: makeMasterId('ms', sanitizedDraft.code || sanitizedDraft.name),
    }

    setSubjects((currentSubjects) => [...currentSubjects, subject])
    setEditingSubjectId(subject.id)
    setSubjectDraft(omitSubjectId(subject))
    onAuditEvent(
      makeMasterAudit(userName, 'Added subject', `${subject.code} ${subject.name} created.`, 'success'),
    )
  }

  const resetMasterData = async () => {
    if (!isAdmin) {
      return
    }

    let nextDepartments = seededDepartments
    let nextSubjects = seededSubjects

    if (backendStatus === 'connected') {
      try {
        const state = await resetMasterDataOnServer()
        nextDepartments = state.departments
        nextSubjects = state.subjects
        setSyncMessage('Master data reset in SQLite backend.')
      } catch {
        setBackendStatus('offline')
        setSyncMessage('Backend reset failed; browser backup reset locally.')
      }
    }

    setDepartments(nextDepartments)
    setSubjects(nextSubjects)
    setEditingDepartmentId(null)
    setEditingSubjectId(null)
    setDepartmentDraft(defaultDepartmentDraft)
    setSubjectDraft(defaultSubjectDraft)
    setDepartmentQuery('')
    setSubjectQuery('')
    setDepartmentStatusFilter('all')
    setSubjectDepartmentFilter('all')
    setSubjectKindFilter('all')
    setSubjectStatusFilter('all')
    clearStoredMasterDataState()
    onAuditEvent(
      makeMasterAudit(userName, 'Reset master data', 'Department and subject master data restored to seed state.', 'info'),
    )
  }

  if (currentRole === 'student') {
    return null
  }

  return (
    <section className={clsx('master-data-module', !isAdmin && 'master-data-module--faculty')}>
      <div className="master-data-header">
        <div>
          <span className="eyebrow">Master data</span>
          <h2>{isAdmin ? 'Departments and subject governance' : 'My department and assigned subjects'}</h2>
          <p>
            Maintain the authoritative department and subject catalog that powers academic setup, circular targeting,
            staff ownership, and audit-ready operations.
          </p>
          <div className={clsx('master-sync-chip', `is-${backendStatus}`)}>
            <span>{backendStatus === 'connected' ? 'SQLite backend' : backendStatus === 'checking' ? 'Checking backend' : 'Browser backup'}</span>
            <strong>{syncMessage}</strong>
          </div>
        </div>
        <div className="master-data-health">
          <strong>{isAdmin ? stats.activeSubjects : assignedSubjects.length}</strong>
          <span>{isAdmin ? 'active subjects' : 'assigned subjects'}</span>
        </div>
      </div>

      <div className="master-data-kpis">
        <article>
          <School size={18} />
          <span>Departments</span>
          <strong>{stats.departments}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Active departments</span>
          <strong>{stats.activeDepartments}</strong>
        </article>
        <article>
          <BookOpenCheck size={18} />
          <span>Subjects</span>
          <strong>{stats.subjects}</strong>
        </article>
        <article>
          <Filter size={18} />
          <span>Labs and electives</span>
          <strong>{stats.labSubjects + stats.electiveSubjects}</strong>
        </article>
      </div>

      {isAdmin ? (
        <>
          <div className="master-data-admin-grid">
            <section className="panel master-directory-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">{visibleDepartments.length} records</span>
                  <h2>Department master</h2>
                </div>
                <School size={20} />
              </div>
              <div className="master-toolbar">
                <label>
                  <Search size={15} />
                  <input
                    value={departmentQuery}
                    onChange={(event) => setDepartmentQuery(event.target.value)}
                    placeholder="Search departments"
                    aria-label="Search departments"
                  />
                </label>
                <select
                  value={departmentStatusFilter}
                  onChange={(event) => setDepartmentStatusFilter(event.target.value as MasterDataStatus | 'all')}
                  aria-label="Filter departments by status"
                >
                  {(['all', ...masterDataStatuses] as const).map((status) => (
                    <option key={status} value={status}>
                      {statusFilterLabel(status)}
                    </option>
                  ))}
                </select>
                <button type="button" className="secondary-action" onClick={startNewDepartment}>
                  <Plus size={15} />
                  <span>New</span>
                </button>
              </div>
              <div className="master-table master-table--departments">
                <div className="master-table-header">
                  <span>Department</span>
                  <span>Code</span>
                  <span>In charge</span>
                  <span>Status</span>
                </div>
                {visibleDepartments.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    className={clsx(
                      'master-table-row',
                      editingDepartmentId === department.id && 'is-active',
                      `status-${department.status}`,
                    )}
                    onClick={() => loadDepartment(department)}
                  >
                    <span>
                      <strong>{department.name}</strong>
                      <small>{department.officeRoom}</small>
                    </span>
                    <span>{department.code}</span>
                    <span>{department.facultyInCharge}</span>
                    <span className={clsx('master-status-pill', `status-${department.status}`)}>
                      {statusLabel(department.status)}
                    </span>
                  </button>
                ))}
                {visibleDepartments.length === 0 ? (
                  <div className="empty-state empty-state--boxed">
                    <Search size={18} />
                    <span>No departments match the current filters.</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel master-editor-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Admin editor</span>
                  <h2>{editingDepartmentId ? 'Edit department' : 'Add department'}</h2>
                </div>
                <BriefcaseBusiness size={20} />
              </div>
              <div className="master-editor-form">
                <label>
                  Department name
                  <input
                    value={departmentDraft.name}
                    onChange={(event) =>
                      setDepartmentDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Code
                  <input
                    value={departmentDraft.code}
                    onChange={(event) =>
                      setDepartmentDraft((currentDraft) => ({ ...currentDraft, code: event.target.value }))
                    }
                  />
                </label>
                <label>
                  HOD / faculty in charge
                  <input
                    list="master-faculty-options"
                    value={departmentDraft.facultyInCharge}
                    onChange={(event) =>
                      setDepartmentDraft((currentDraft) => ({
                        ...currentDraft,
                        facultyInCharge: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Office / room
                  <input
                    value={departmentDraft.officeRoom}
                    onChange={(event) =>
                      setDepartmentDraft((currentDraft) => ({ ...currentDraft, officeRoom: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    value={departmentDraft.status}
                    onChange={(event) =>
                      setDepartmentDraft((currentDraft) => ({
                        ...currentDraft,
                        status: event.target.value as MasterDataStatus,
                      }))
                    }
                  >
                    {masterDataStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                {departmentErrors.length > 0 ? (
                  <div className="master-validation-list">
                    {departmentErrors.map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                ) : null}
                <div className="master-editor-actions">
                  <button type="button" className="primary-action" disabled={departmentErrors.length > 0} onClick={saveDepartment}>
                    <CheckCircle2 size={16} />
                    <span>Save department</span>
                  </button>
                  <button type="button" className="secondary-action" onClick={startNewDepartment}>
                    <Plus size={15} />
                    <span>Clear</span>
                  </button>
                  <button type="button" className="secondary-action" onClick={resetMasterData}>
                    <RefreshCw size={15} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="master-subject-grid">
            <section className="panel master-subject-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">{visibleSubjects.length} records</span>
                  <h2>Subject master</h2>
                </div>
                <BookOpenCheck size={20} />
              </div>
              <div className="master-toolbar master-toolbar--subjects">
                <label>
                  <Search size={15} />
                  <input
                    value={subjectQuery}
                    onChange={(event) => setSubjectQuery(event.target.value)}
                    placeholder="Search subjects"
                    aria-label="Search subjects"
                  />
                </label>
                <select
                  value={subjectDepartmentFilter}
                  onChange={(event) => setSubjectDepartmentFilter(event.target.value)}
                  aria-label="Filter subjects by department"
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.code}
                    </option>
                  ))}
                </select>
                <select
                  value={subjectKindFilter}
                  onChange={(event) => setSubjectKindFilter(event.target.value as SubjectKind | 'all')}
                  aria-label="Filter subjects by kind"
                >
                  <option value="all">All kinds</option>
                  {subjectKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {subjectKindLabel(kind)}
                    </option>
                  ))}
                </select>
                <select
                  value={subjectStatusFilter}
                  onChange={(event) => setSubjectStatusFilter(event.target.value as MasterDataStatus | 'all')}
                  aria-label="Filter subjects by status"
                >
                  {(['all', ...masterDataStatuses] as const).map((status) => (
                    <option key={status} value={status}>
                      {statusFilterLabel(status)}
                    </option>
                  ))}
                </select>
                <button type="button" className="secondary-action" onClick={startNewSubject}>
                  <Plus size={15} />
                  <span>New</span>
                </button>
              </div>
              <div className="master-table master-table--subjects">
                <div className="master-table-header">
                  <span>Subject</span>
                  <span>Department</span>
                  <span>Sem</span>
                  <span>Credits</span>
                  <span>Faculty</span>
                  <span>Status</span>
                </div>
                {visibleSubjects.map((subject) => {
                  const department = departmentById.get(subject.departmentId)
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      className={clsx(
                        'master-table-row',
                        editingSubjectId === subject.id && 'is-active',
                        `kind-${subject.kind}`,
                        `status-${subject.status}`,
                      )}
                      onClick={() => loadSubject(subject)}
                    >
                      <span>
                        <strong>{subject.code}</strong>
                        <small>{subject.name} / {subjectKindLabel(subject.kind)}</small>
                      </span>
                      <span>{department?.code ?? 'N/A'}</span>
                      <span>{subject.semester}</span>
                      <span>{subject.credits}</span>
                      <span>{subject.defaultFaculty}</span>
                      <span className={clsx('master-status-pill', `status-${subject.status}`)}>
                        {statusLabel(subject.status)}
                      </span>
                    </button>
                  )
                })}
                {visibleSubjects.length === 0 ? (
                  <div className="empty-state empty-state--boxed">
                    <Search size={18} />
                    <span>No subjects match the current filters.</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel master-editor-panel master-editor-panel--subject">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Admin editor</span>
                  <h2>{editingSubjectId ? 'Edit subject' : 'Add subject'}</h2>
                </div>
                <GraduationCap size={20} />
              </div>
              <div className="master-editor-form">
                <label>
                  Department
                  <select
                    value={subjectDraft.departmentId}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, departmentId: event.target.value }))
                    }
                  >
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.code} / {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Semester
                  <select
                    value={subjectDraft.semester}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, semester: Number(event.target.value) }))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Subject code
                  <input
                    value={subjectDraft.code}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, code: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Subject name
                  <input
                    value={subjectDraft.name}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Credits
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={subjectDraft.credits}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, credits: Number(event.target.value) }))
                    }
                  />
                </label>
                <label>
                  Type
                  <select
                    value={subjectDraft.kind}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({
                        ...currentDraft,
                        kind: event.target.value as SubjectKind,
                      }))
                    }
                  >
                    {subjectKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {subjectKindLabel(kind)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Default faculty
                  <input
                    list="master-faculty-options"
                    value={subjectDraft.defaultFaculty}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({ ...currentDraft, defaultFaculty: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    value={subjectDraft.status}
                    onChange={(event) =>
                      setSubjectDraft((currentDraft) => ({
                        ...currentDraft,
                        status: event.target.value as MasterDataStatus,
                      }))
                    }
                  >
                    {masterDataStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                {subjectErrors.length > 0 ? (
                  <div className="master-validation-list">
                    {subjectErrors.map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                  </div>
                ) : null}
                <div className="master-editor-actions">
                  <button type="button" className="primary-action" disabled={subjectErrors.length > 0} onClick={saveSubject}>
                    <CheckCircle2 size={16} />
                    <span>Save subject</span>
                  </button>
                  <button type="button" className="secondary-action" onClick={startNewSubject}>
                    <Plus size={15} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="master-faculty-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Department</span>
                <h2>{facultyDepartment?.name ?? currentTeacher?.department ?? 'Faculty profile'}</h2>
              </div>
              <School size={20} />
            </div>
            {facultyDepartment ? (
              <>
                <div className="master-profile-card">
                  <div>
                    <strong>{facultyDepartment.code}</strong>
                    <span>{facultyDepartment.facultyInCharge}</span>
                  </div>
                  <span className={clsx('master-status-pill', `status-${facultyDepartment.status}`)}>
                    {statusLabel(facultyDepartment.status)}
                  </span>
                </div>
                <div className="master-info-grid">
                  <article>
                    <BriefcaseBusiness size={15} />
                    <span>{facultyDepartment.officeRoom}</span>
                  </article>
                  <article>
                    <BookOpenCheck size={15} />
                    <span>{facultyDepartmentSubjects.length} active subjects</span>
                  </article>
                </div>
              </>
            ) : (
              <div className="empty-state empty-state--boxed">
                <School size={18} />
                <span>No master department is linked to this faculty login yet.</span>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{assignedSubjects.length} assigned</span>
                <h2>My subject ownership</h2>
              </div>
              <UsersRound size={20} />
            </div>
            <div className="master-card-list">
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map((subject) => (
                  <article key={subject.id} className={clsx('master-subject-card', `kind-${subject.kind}`)}>
                    <div>
                      <span>{departmentById.get(subject.departmentId)?.code} / Sem {subject.semester}</span>
                      <strong>{subject.code} / {subject.name}</strong>
                      <small>{subject.credits} credits / {subjectKindLabel(subject.kind)}</small>
                    </div>
                    <span className={clsx('master-status-pill', `status-${subject.status}`)}>
                      {statusLabel(subject.status)}
                    </span>
                  </article>
                ))
              ) : (
                <div className="empty-state empty-state--boxed">
                  <BookOpenCheck size={18} />
                  <span>No subjects are assigned to your profile in master data.</span>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{facultyDepartmentSubjects.length} active</span>
                <h2>Department catalog</h2>
              </div>
              <BookOpenCheck size={20} />
            </div>
            <div className="master-card-list">
              {facultyDepartmentSubjects.length > 0 ? (
                facultyDepartmentSubjects.map((subject) => (
                  <article key={subject.id} className="master-subject-card">
                    <div>
                      <span>Sem {subject.semester} / {subjectKindLabel(subject.kind)}</span>
                      <strong>{subject.code} / {subject.name}</strong>
                      <small>{subject.defaultFaculty}</small>
                    </div>
                    <strong className="master-credit-chip">{subject.credits}</strong>
                  </article>
                ))
              ) : (
                <div className="empty-state empty-state--boxed">
                  <Search size={18} />
                  <span>No active subjects are available for this department.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <datalist id="master-faculty-options">
        {facultyOptions.map((facultyName) => (
          <option key={facultyName} value={facultyName} />
        ))}
      </datalist>
    </section>
  )
}
