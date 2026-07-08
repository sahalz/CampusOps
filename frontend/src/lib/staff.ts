import type { StaffProfile, StaffStatus, TimetableSlot } from '../types'

export function staffStatusLabel(status: StaffStatus) {
  if (status === 'on_leave') {
    return 'On leave'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getStaffWorkload(staff: StaffProfile, slots: TimetableSlot[]) {
  return slots.filter((slot) => slot.teacherId === staff.teacherId).length
}

export function isStaffOverloaded(staff: StaffProfile, slots: TimetableSlot[], threshold = 4) {
  return getStaffWorkload(staff, slots) >= threshold
}

export function summarizeStaff(staffProfiles: StaffProfile[], slots: TimetableSlot[]) {
  const active = staffProfiles.filter((staff) => staff.status === 'active').length
  const onLeave = staffProfiles.filter((staff) => staff.status === 'on_leave').length
  const overloaded = staffProfiles.filter((staff) => isStaffOverloaded(staff, slots)).length
  const departments = new Set(staffProfiles.map((staff) => staff.department)).size

  return {
    total: staffProfiles.length,
    active,
    onLeave,
    overloaded,
    departments,
  }
}
