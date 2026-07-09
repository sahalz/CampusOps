import { createServer } from 'node:http'
import {
  createAuthSession,
  createAuditEvent,
  createDepartment,
  createCircular,
  createCircularReadReceipt,
  createCircularReadReceipts,
  createKnowledgeDocument,
  createReportAuditEvent,
  createStaffProfile,
  createSubject,
  commitImportRows,
  deleteAuthSession,
  getAcademicState,
  getAuditEvents,
  getAuthSession,
  getAuthUsers,
  getCircularState,
  getDatabaseInfo,
  getDepartments,
  getKnowledgeState,
  getMasterData,
  getReportByName,
  getReports,
  getStaffState,
  getSubjects,
  previewImportRows,
  resetAcademicData,
  resetCircularData,
  resetKnowledgeData,
  resetMasterData,
  resetStaffData,
  saveAcademicState,
  searchCircularIntelligence,
  searchKnowledgeBase,
  updateDepartment,
  updateStaffProfile,
  updateSubject,
} from './db.js'
import {
  cleanDepartment,
  cleanSubject,
  validateDepartmentDraft,
  validateSubjectDraft,
} from './validation.js'

const port = Number(process.env.PORT ?? 4174)
const host = process.env.HOST ?? '127.0.0.1'

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  response.end(JSON.stringify(payload))
}

function notFound(response) {
  sendJson(response, 404, {
    error: 'Not found',
  })
}

function methodNotAllowed(response) {
  sendJson(response, 405, {
    error: 'Method not allowed',
  })
}

function validationError(response, errors) {
  sendJson(response, 422, {
    error: 'Validation failed',
    errors,
  })
}

function unauthorized(response) {
  sendJson(response, 401, {
    error: 'Authentication required',
  })
}

function forbidden(response) {
  sendJson(response, 403, {
    error: 'Insufficient role permissions',
  })
}

function serverError(response, error) {
  sendJson(response, 500, {
    error: 'Server error',
    detail: error instanceof Error ? error.message : 'Unknown error',
  })
}

function getBearerToken(request) {
  const header = request.headers.authorization ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? ''
}

function requireRoles(request, response, allowedRoles) {
  const session = getAuthSession(getBearerToken(request))
  if (!session) {
    unauthorized(response)
    return null
  }

  if (!allowedRoles.includes(session.user.role)) {
    forbidden(response)
    return null
  }

  return session
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 5_000_000) {
        request.destroy()
        reject(new Error('Request body is too large.'))
      }
    })
    request.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

async function handleAuth(request, response, pathname) {
  if (pathname === '/api/auth/users') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    sendJson(response, 200, {
      users: getAuthUsers(),
    })
    return
  }

  if (pathname === '/api/auth/login') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    sendJson(response, 201, {
      session: createAuthSession(await readJson(request)),
    })
    return
  }

  if (pathname === '/api/auth/session') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    const session = getAuthSession(getBearerToken(request))
    if (!session) {
      unauthorized(response)
      return
    }

    sendJson(response, 200, {
      session,
    })
    return
  }

  if (pathname === '/api/auth/logout') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    sendJson(response, 200, deleteAuthSession(getBearerToken(request)))
    return
  }

  notFound(response)
}

async function handleMasterData(request, response, pathname) {
  if (pathname === '/api/master-data') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty'])) {
      return
    }

    sendJson(response, 200, getMasterData())
    return
  }

  if (pathname === '/api/master-data/reset') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    sendJson(response, 200, resetMasterData())
    return
  }

  if (pathname === '/api/departments') {
    if (request.method === 'GET') {
      if (!requireRoles(request, response, ['admin', 'faculty'])) {
        return
      }

      sendJson(response, 200, {
        departments: getDepartments(),
      })
      return
    }

    if (request.method === 'POST') {
      if (!requireRoles(request, response, ['admin'])) {
        return
      }

      const draft = cleanDepartment(await readJson(request))
      const errors = validateDepartmentDraft(draft, getDepartments())
      if (errors.length > 0) {
        validationError(response, errors)
        return
      }

      sendJson(response, 201, {
        department: createDepartment(draft),
      })
      return
    }

    methodNotAllowed(response)
    return
  }

  const departmentMatch = pathname.match(/^\/api\/departments\/([^/]+)$/)
  if (departmentMatch) {
    if (request.method !== 'PUT') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    const id = decodeURIComponent(departmentMatch[1])
    const draft = cleanDepartment(await readJson(request))
    const errors = validateDepartmentDraft(draft, getDepartments(), id)
    if (errors.length > 0) {
      validationError(response, errors)
      return
    }

    const department = updateDepartment(id, draft)
    if (!department) {
      notFound(response)
      return
    }

    sendJson(response, 200, {
      department,
    })
    return
  }

  if (pathname === '/api/subjects') {
    if (request.method === 'GET') {
      if (!requireRoles(request, response, ['admin', 'faculty'])) {
        return
      }

      sendJson(response, 200, {
        subjects: getSubjects(),
      })
      return
    }

    if (request.method === 'POST') {
      if (!requireRoles(request, response, ['admin'])) {
        return
      }

      const draft = cleanSubject(await readJson(request))
      const errors = validateSubjectDraft(draft, getDepartments(), getSubjects())
      if (errors.length > 0) {
        validationError(response, errors)
        return
      }

      sendJson(response, 201, {
        subject: createSubject(draft),
      })
      return
    }

    methodNotAllowed(response)
    return
  }

  const subjectMatch = pathname.match(/^\/api\/subjects\/([^/]+)$/)
  if (subjectMatch) {
    if (request.method !== 'PUT') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    const id = decodeURIComponent(subjectMatch[1])
    const draft = cleanSubject(await readJson(request))
    const errors = validateSubjectDraft(draft, getDepartments(), getSubjects(), id)
    if (errors.length > 0) {
      validationError(response, errors)
      return
    }

    const subject = updateSubject(id, draft)
    if (!subject) {
      notFound(response)
      return
    }

    sendJson(response, 200, {
      subject,
    })
    return
  }

  notFound(response)
}

async function handleAudit(request, response, pathname) {
  if (pathname !== '/api/audit-events') {
    notFound(response)
    return
  }

  if (request.method === 'GET') {
    sendJson(response, 200, {
      auditEvents: getAuditEvents(),
    })
    return
  }

  if (request.method === 'POST') {
    const event = await readJson(request)
    sendJson(response, 201, {
      auditEvent: createAuditEvent(event),
    })
    return
  }

  methodNotAllowed(response)
}

async function handleAcademicState(request, response, pathname) {
  if (pathname === '/api/academic-state') {
    if (request.method === 'GET') {
      sendJson(response, 200, getAcademicState())
      return
    }

    if (request.method === 'PUT') {
      const state = await readJson(request)
      sendJson(response, 200, saveAcademicState(state))
      return
    }

    methodNotAllowed(response)
    return
  }

  if (pathname === '/api/academic-state/reset') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    sendJson(response, 200, resetAcademicData())
    return
  }

  notFound(response)
}

async function handleStaff(request, response, pathname) {
  if (pathname === '/api/staff-state') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty'])) {
      return
    }

    sendJson(response, 200, getStaffState())
    return
  }

  if (pathname === '/api/staff-profiles') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    sendJson(response, 201, {
      staffProfile: createStaffProfile(await readJson(request)),
    })
    return
  }

  const staffProfileMatch = pathname.match(/^\/api\/staff-profiles\/([^/]+)$/)
  if (staffProfileMatch) {
    if (request.method !== 'PUT') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    const id = decodeURIComponent(staffProfileMatch[1])
    const staffProfile = updateStaffProfile(id, await readJson(request))
    if (!staffProfile) {
      notFound(response)
      return
    }

    sendJson(response, 200, {
      staffProfile,
    })
    return
  }

  if (pathname === '/api/staff-state/reset') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    sendJson(response, 200, resetStaffData())
    return
  }

  notFound(response)
}

async function handleCirculars(request, response, pathname) {
  if (pathname === '/api/circular-intelligence/search') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin', 'faculty', 'student'])
    if (!session) {
      return
    }

    sendJson(response, 200, searchCircularIntelligence(await readJson(request), session.user))
    return
  }

  if (pathname === '/api/circular-state') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty', 'student'])) {
      return
    }

    sendJson(response, 200, getCircularState())
    return
  }

  if (pathname === '/api/circulars') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    sendJson(response, 201, {
      circular: createCircular(await readJson(request)),
    })
    return
  }

  if (pathname === '/api/circular-read-receipts') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty', 'student'])) {
      return
    }

    sendJson(response, 201, {
      readReceipt: createCircularReadReceipt(await readJson(request)),
    })
    return
  }

  if (pathname === '/api/circular-read-receipts/bulk') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty', 'student'])) {
      return
    }

    const payload = await readJson(request)
    sendJson(response, 200, {
      readReceipts: createCircularReadReceipts(payload.readReceipts),
    })
    return
  }

  if (pathname === '/api/circular-state/reset') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    sendJson(response, 200, resetCircularData())
    return
  }

  notFound(response)
}

function readReportFilters(searchParams) {
  return {
    department: searchParams.get('department') ?? 'all',
    semester: searchParams.get('semester') ?? 'all',
    date: searchParams.get('date') ?? '',
    status: searchParams.get('status') ?? 'all',
    role: searchParams.get('role') ?? 'admin',
    actorId: searchParams.get('actorId') ?? '',
  }
}

async function handleReports(request, response, pathname, searchParams) {
  if (pathname === '/api/reports') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin', 'faculty'])
    if (!session) {
      return
    }

    sendJson(response, 200, getReports({ ...readReportFilters(searchParams), role: session.user.role, actorId: session.user.actorId }))
    return
  }

  if (pathname === '/api/reports/actions') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty'])) {
      return
    }

    sendJson(response, 201, {
      auditEvent: createReportAuditEvent(await readJson(request)),
    })
    return
  }

  const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/)
  if (reportMatch) {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin', 'faculty'])
    if (!session) {
      return
    }

    sendJson(response, 200, getReportByName(decodeURIComponent(reportMatch[1]), {
      ...readReportFilters(searchParams),
      role: session.user.role,
      actorId: session.user.actorId,
    }))
    return
  }

  notFound(response)
}

async function handleImports(request, response, pathname) {
  if (pathname === '/api/import/preview') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin'])) {
      return
    }

    const payload = await readJson(request)
    sendJson(response, 200, previewImportRows(payload.kind, payload.rows))
    return
  }

  if (pathname === '/api/import/commit') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin'])
    if (!session) {
      return
    }

    const payload = await readJson(request)
    sendJson(response, 200, commitImportRows(payload.kind, payload.rows, session.user.name))
    return
  }

  notFound(response)
}

async function handleKnowledge(request, response, pathname) {
  if (pathname === '/api/knowledge') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
      return
    }

    if (!requireRoles(request, response, ['admin', 'faculty', 'student'])) {
      return
    }

    sendJson(response, 200, getKnowledgeState())
    return
  }

  if (pathname === '/api/knowledge/search') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin', 'faculty', 'student'])
    if (!session) {
      return
    }

    sendJson(response, 200, searchKnowledgeBase(await readJson(request), session.user.name))
    return
  }

  if (pathname === '/api/knowledge/documents') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin'])
    if (!session) {
      return
    }

    sendJson(response, 201, createKnowledgeDocument(await readJson(request), session.user.name))
    return
  }

  if (pathname === '/api/knowledge/reset') {
    if (request.method !== 'POST') {
      methodNotAllowed(response)
      return
    }

    const session = requireRoles(request, response, ['admin'])
    if (!session) {
      return
    }

    sendJson(response, 200, resetKnowledgeData(session.user.name))
    return
  }

  notFound(response)
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`)
  const { pathname } = url
  const { searchParams } = url

  try {
    if (pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        service: 'CampusOps AI backend',
        database: getDatabaseInfo(),
      })
      return
    }

    if (pathname.startsWith('/api/auth')) {
      await handleAuth(request, response, pathname)
      return
    }

    if (
      pathname.startsWith('/api/master-data') ||
      pathname.startsWith('/api/departments') ||
      pathname.startsWith('/api/subjects')
    ) {
      await handleMasterData(request, response, pathname)
      return
    }

    if (pathname.startsWith('/api/academic-state')) {
      await handleAcademicState(request, response, pathname)
      return
    }

    if (pathname.startsWith('/api/staff-state') || pathname.startsWith('/api/staff-profiles')) {
      await handleStaff(request, response, pathname)
      return
    }

    if (
      pathname.startsWith('/api/circular-state') ||
      pathname.startsWith('/api/circular-intelligence') ||
      pathname.startsWith('/api/circulars') ||
      pathname.startsWith('/api/circular-read-receipts')
    ) {
      await handleCirculars(request, response, pathname)
      return
    }

    if (pathname.startsWith('/api/reports')) {
      await handleReports(request, response, pathname, searchParams)
      return
    }

    if (pathname.startsWith('/api/import')) {
      await handleImports(request, response, pathname)
      return
    }

    if (pathname.startsWith('/api/knowledge')) {
      await handleKnowledge(request, response, pathname)
      return
    }

    if (pathname.startsWith('/api/audit-events')) {
      await handleAudit(request, response, pathname)
      return
    }

    notFound(response)
  } catch (error) {
    serverError(response, error)
  }
})

server.listen(port, host, () => {
  console.log(`CampusOps backend running at http://${host}:${port}`)
})
