import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  IdCard,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'
import { staffProfiles as seededStaffProfiles } from '../../data/staff'
import {
  subjects,
  timetableSlots,
} from '../../data/academic'
import {
  getStaffWorkload,
  staffStatusLabel,
  summarizeStaff,
} from '../../lib/staff'
import type {
  AuditEvent,
  Role,
  StaffProfile,
  StaffStatus,
} from '../../types'

type StaffRegisterProps = {
  currentRole: Role
  actorId: string
  userName: string
  onAuditEvent: (event: AuditEvent) => void
}

type StaffDraft = Omit<StaffProfile, 'id' | 'teacherId'>

type StoredStaffState = {
  version: 1
  staffProfiles: StaffProfile[]
}

const storageKey = 'campusops-staff-register-v1'

const defaultDraft: StaffDraft = {
  employeeCode: 'EMP-CS-032',
  name: 'Prof. Ramesh Kumar',
  department: 'Computer Science',
  designation: 'Assistant Professor',
  email: 'ramesh.kumar@campus.edu',
  phone: '+91 98765 22032',
  status: 'active',
  joinedAt: '2026-07-01',
  officeRoom: 'CS-220',
}

function makeAudit(actor: string, action: string, outcome: string, severity: AuditEvent['severity']): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor,
    action,
    outcome,
    severity,
  }
}

function readStoredStaffState(): StoredStaffState | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredStaffState>
    if (parsed.version !== 1 || !Array.isArray(parsed.staffProfiles)) {
      return null
    }

    return parsed as StoredStaffState
  } catch {
    return null
  }
}

function writeStoredStaffState(state: StoredStaffState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Staff register remains usable in-memory if browser storage is unavailable.
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function StaffRegister({ currentRole, actorId, userName, onAuditEvent }: StaffRegisterProps) {
  const [storedState] = useState(() => readStoredStaffState())
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>(
    () => storedState?.staffProfiles ?? seededStaffProfiles,
  )
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all')
  const [selectedStaffId, setSelectedStaffId] = useState(staffProfiles[0]?.id ?? '')
  const [draft, setDraft] = useState<StaffDraft>(defaultDraft)
  const isAdmin = currentRole === 'admin'
  const currentStaff = staffProfiles.find((staff) => staff.teacherId === actorId)
  const selectedStaff = staffProfiles.find((staff) => staff.id === selectedStaffId) ?? staffProfiles[0]
  const departments = useMemo(
    () => Array.from(new Set(staffProfiles.map((staff) => staff.department))).sort(),
    [staffProfiles],
  )
  const stats = useMemo(() => summarizeStaff(staffProfiles, timetableSlots), [staffProfiles])

  const visibleStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return staffProfiles
      .filter((staff) => departmentFilter === 'all' || staff.department === departmentFilter)
      .filter((staff) => statusFilter === 'all' || staff.status === statusFilter)
      .filter(
        (staff) =>
          !normalizedQuery ||
          staff.name.toLowerCase().includes(normalizedQuery) ||
          staff.employeeCode.toLowerCase().includes(normalizedQuery) ||
          staff.email.toLowerCase().includes(normalizedQuery),
      )
      .sort((first, second) => first.department.localeCompare(second.department) || first.name.localeCompare(second.name))
  }, [departmentFilter, query, staffProfiles, statusFilter])

  const profileForView = isAdmin ? selectedStaff : currentStaff
  const profileSlots = profileForView
    ? timetableSlots.filter((slot) => slot.teacherId === profileForView.teacherId)
    : []
  const canSave = draft.name.trim().length >= 4 && draft.email.includes('@') && draft.employeeCode.trim().length >= 4

  useEffect(() => {
    writeStoredStaffState({
      version: 1,
      staffProfiles,
    })
  }, [staffProfiles])

  const saveStaff = () => {
    if (!isAdmin || !canSave) {
      return
    }

    const exists = staffProfiles.some((staff) => staff.employeeCode.toLowerCase() === draft.employeeCode.toLowerCase())
    if (exists) {
      setStaffProfiles((currentProfiles) =>
        currentProfiles.map((staff) =>
          staff.employeeCode.toLowerCase() === draft.employeeCode.toLowerCase()
            ? {
                ...staff,
                ...draft,
              }
            : staff,
        ),
      )
      onAuditEvent(makeAudit(userName, 'Updated staff profile', `${draft.name} profile updated.`, 'success'))
      return
    }

    const profile: StaffProfile = {
      ...draft,
      id: `staff-${slugify(draft.employeeCode)}-${Date.now().toString(36)}`,
      teacherId: `t-${slugify(draft.email)}`,
    }
    setStaffProfiles((currentProfiles) => [profile, ...currentProfiles])
    setSelectedStaffId(profile.id)
    setDraft(defaultDraft)
    onAuditEvent(makeAudit(userName, 'Added staff profile', `${profile.name} added to staff register.`, 'success'))
  }

  const resetStaff = () => {
    if (!isAdmin) {
      return
    }

    setStaffProfiles(seededStaffProfiles)
    setSelectedStaffId(seededStaffProfiles[0].id)
    setDraft(defaultDraft)
    onAuditEvent(makeAudit(userName, 'Reset staff register', 'Staff demo register restored to seed state.', 'info'))
  }

  const loadIntoForm = (staff: StaffProfile) => {
    setSelectedStaffId(staff.id)
    setDraft({
      employeeCode: staff.employeeCode,
      name: staff.name,
      department: staff.department,
      designation: staff.designation,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
      joinedAt: staff.joinedAt,
      officeRoom: staff.officeRoom,
    })
  }

  if (currentRole === 'student') {
    return null
  }

  return (
    <section className="staff-module">
      <div className="staff-header">
        <div>
          <span className="eyebrow">Staff register</span>
          <h2>{isAdmin ? 'Faculty and staff management' : 'My faculty profile and workload'}</h2>
          <p>
            Track staff status, departments, contact details, office rooms, and teaching load from mapped timetable slots.
          </p>
        </div>
        <div className="staff-health">
          <strong>{isAdmin ? stats.total : profileSlots.length}</strong>
          <span>{isAdmin ? 'staff profiles' : 'assigned slots'}</span>
        </div>
      </div>

      <div className="staff-kpis">
        <article>
          <UsersRound size={18} />
          <span>Active</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <BriefcaseBusiness size={18} />
          <span>Departments</span>
          <strong>{stats.departments}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>On leave</span>
          <strong>{stats.onLeave}</strong>
        </article>
        <article>
          <Filter size={18} />
          <span>High load</span>
          <strong>{stats.overloaded}</strong>
        </article>
      </div>

      <div className={clsx('staff-grid', isAdmin && 'staff-grid--admin')}>
        <section className="panel staff-register-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">{visibleStaff.length} records</span>
              <h2>{isAdmin ? 'Staff directory' : 'Profile summary'}</h2>
            </div>
            <IdCard size={20} />
          </div>

          {isAdmin ? (
            <div className="staff-filters">
              <label>
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search staff"
                  aria-label="Search staff"
                />
              </label>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StaffStatus | 'all')}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          ) : null}

          <div className="staff-list">
            {(isAdmin ? visibleStaff : currentStaff ? [currentStaff] : []).map((staff) => {
              const workload = getStaffWorkload(staff, timetableSlots)
              return (
                <button
                  key={staff.id}
                  type="button"
                  className={clsx('staff-row', selectedStaffId === staff.id && 'is-active', `status-${staff.status}`)}
                  onClick={() => loadIntoForm(staff)}
                >
                  <div>
                    <span>{staff.employeeCode}</span>
                    <strong>{staff.name}</strong>
                    <small>{staff.designation} / {staff.department}</small>
                  </div>
                  <div className="staff-row__meta">
                    <span className={clsx('staff-status-pill', `status-${staff.status}`)}>
                      {staffStatusLabel(staff.status)}
                    </span>
                    <small>{workload} slots</small>
                  </div>
                </button>
              )
            })}
            {!isAdmin && !currentStaff ? (
              <div className="empty-state empty-state--boxed">
                <IdCard size={18} />
                <span>No staff profile is linked to this login yet.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel staff-profile-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Faculty detail</span>
              <h2>{profileForView?.name ?? 'Staff profile'}</h2>
            </div>
            <BriefcaseBusiness size={20} />
          </div>

          {profileForView ? (
            <>
              <div className="staff-profile-card">
                <div>
                  <strong>{profileForView.designation}</strong>
                  <span>{profileForView.department} / {profileForView.officeRoom}</span>
                </div>
                <span className={clsx('staff-status-pill', `status-${profileForView.status}`)}>
                  {staffStatusLabel(profileForView.status)}
                </span>
              </div>
              <div className="staff-contact-grid">
                <article>
                  <Mail size={15} />
                  <span>{profileForView.email}</span>
                </article>
                <article>
                  <Phone size={15} />
                  <span>{profileForView.phone}</span>
                </article>
              </div>
              <div className="staff-assignment-list">
                {profileSlots.length > 0 ? (
                  profileSlots.map((slot) => (
                    <article key={slot.id}>
                      <strong>P{slot.periodNumber} / {slot.day}</strong>
                      <span>{subjects.find((subject) => subject.id === slot.subjectId)?.name} / {slot.room}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state empty-state--boxed">
                    <BriefcaseBusiness size={18} />
                    <span>No timetable slots are assigned yet.</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>

        {isAdmin ? (
          <section className="panel staff-editor-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Admin editor</span>
                <h2>Add or update staff</h2>
              </div>
              <Plus size={20} />
            </div>
            <div className="staff-editor-form">
              <label>
                Employee code
                <input
                  value={draft.employeeCode}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, employeeCode: event.target.value }))}
                />
              </label>
              <label>
                Name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                />
              </label>
              <label>
                Department
                <input
                  value={draft.department}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, department: event.target.value }))}
                />
              </label>
              <label>
                Designation
                <input
                  value={draft.designation}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, designation: event.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  value={draft.email}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, email: event.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  value={draft.phone}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, phone: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, status: event.target.value as StaffStatus }))}
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                Office room
                <input
                  value={draft.officeRoom}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, officeRoom: event.target.value }))}
                />
              </label>
              <label>
                Joined
                <input
                  type="date"
                  value={draft.joinedAt}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, joinedAt: event.target.value }))}
                />
              </label>
              <div className="staff-editor-actions">
                <button type="button" className="primary-action" disabled={!canSave} onClick={saveStaff}>
                  <Plus size={16} />
                  <span>Save staff</span>
                </button>
                <button type="button" className="secondary-action" onClick={resetStaff}>
                  <RefreshCw size={15} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}
