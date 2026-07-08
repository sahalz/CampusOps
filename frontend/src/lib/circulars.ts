import type { Circular, CircularAudience, ClassSection, Role, Student, Teacher } from '../types'

type CircularViewer = {
  role: Role
  actorId: string
  classSections: ClassSection[]
  students: Student[]
  teachers: Teacher[]
}

function normalizeDepartment(value: string) {
  const normalized = value.toLowerCase()

  if (normalized.includes('cse') || normalized.includes('computer')) {
    return 'computer science'
  }

  if (normalized.includes('ece') || normalized.includes('electronic')) {
    return 'electronics'
  }

  return normalized
}

export function formatAudience(audience: CircularAudience) {
  if (audience.type === 'everyone') {
    return 'Everyone'
  }

  if (audience.type === 'students') {
    return 'All students'
  }

  if (audience.type === 'faculty') {
    return 'All faculty'
  }

  if (audience.type === 'class') {
    return 'Selected class'
  }

  if (audience.type === 'department') {
    return audience.department
  }

  return 'Selected audience'
}

export function isCircularActive(circular: Circular, today: string) {
  return !circular.expiresAt || circular.expiresAt >= today
}

export function isCircularVisibleTo(circular: Circular, viewer: CircularViewer) {
  if (viewer.role === 'admin') {
    return true
  }

  const { audience } = circular
  if (audience.type === 'everyone') {
    return true
  }

  if (viewer.role === 'student') {
    const student = viewer.students.find((item) => item.id === viewer.actorId)
    const section = student ? viewer.classSections.find((item) => item.id === student.classSectionId) : undefined
    if (!student) {
      return false
    }

    return (
      audience.type === 'students' ||
      (audience.type === 'class' && audience.classSectionId === student.classSectionId) ||
      (audience.type === 'department' &&
        Boolean(section) &&
        normalizeDepartment(section?.program ?? '') === normalizeDepartment(audience.department))
    )
  }

  if (viewer.role === 'faculty') {
    const teacher = viewer.teachers.find((item) => item.id === viewer.actorId)
    return audience.type === 'faculty' || (audience.type === 'department' && teacher?.department === audience.department)
  }

  return false
}

export function rankCircularPriority(priority: Circular['priority']) {
  if (priority === 'urgent') {
    return 0
  }

  if (priority === 'important') {
    return 1
  }

  return 2
}
