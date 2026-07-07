import { createServer } from 'node:http'
import {
  createAuditEvent,
  createDepartment,
  createSubject,
  getAcademicState,
  getAuditEvents,
  getDatabaseInfo,
  getDepartments,
  getMasterData,
  getSubjects,
  resetAcademicData,
  resetMasterData,
  saveAcademicState,
  updateDepartment,
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
    'Access-Control-Allow-Headers': 'Content-Type',
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

function serverError(response, error) {
  sendJson(response, 500, {
    error: 'Server error',
    detail: error instanceof Error ? error.message : 'Unknown error',
  })
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) {
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

async function handleMasterData(request, response, pathname) {
  if (pathname === '/api/master-data') {
    if (request.method !== 'GET') {
      methodNotAllowed(response)
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

    sendJson(response, 200, resetMasterData())
    return
  }

  if (pathname === '/api/departments') {
    if (request.method === 'GET') {
      sendJson(response, 200, {
        departments: getDepartments(),
      })
      return
    }

    if (request.method === 'POST') {
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
      sendJson(response, 200, {
        subjects: getSubjects(),
      })
      return
    }

    if (request.method === 'POST') {
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

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`)
  const { pathname } = url

  try {
    if (pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        service: 'CampusOps AI backend',
        database: getDatabaseInfo(),
      })
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
