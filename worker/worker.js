/* eslint-env browser */ // Because serviceworker doesn't describe Cloudflare workers well

addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request))
  } catch (error) {
    console.log('Exception caught: ', error)
    event.respondWith(new Response('500 - Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error'
    }))
  }
})

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest (request) {
  await wasm_bindgen(wasm) // eslint-disable-line no-undef

  // First run
  if (notFound === undefined) {
    // Add the 404 file or create a default one if it doesn't exist
    const body = lookup('/404.html')
    notFound = body === undefined ? {} : {
      body,
      headers: new Headers({
        'Content-Encoding': 'gzip',
        'Content-Type': mimeTypes['html']
      })
    }
  }

  // Standardise the url to point to a file or index.html
  let pathname = new URL(request.url).pathname
  if (pathname.endsWith('/')) {
    pathname = `${pathname}index.html`
  } else if (pathname.includes('/.') || pathname.endsWith('.html')) {
    return createResponse(404, notFound.body, notFound.headers)
  } else if (!pathname.substr(pathname.lastIndexOf('/') + 1).includes('.')) {
    return createResponse(301, null, new Headers({ 'Location': `${pathname}/` }))
  }

  // Get the file information from the (in-wasm) file cache and return 404 if not found
  const staticFile = await cachedFileLookup(pathname)
  if (staticFile === undefined) {
    return createResponse(404, notFound.body, notFound.headers)
  }

  // Return the correct response
  const etags = (request.headers.get('If-None-Match') || '').split(',').map(t => t.trim())
  const etag = etags.find(t => t === staticFile.etag || t === `W/${staticFile.etag}`)
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return createResponse(501)
  } else if (etag !== undefined) {
    return createResponse(304, null, new Headers({ 'ETag': etag }))
  } else if (request.method === 'GET') {
    return createResponse(200, staticFile.body, staticFile.headers)
  } else if (request.method === 'HEAD') {
    return createResponse(200, null, staticFile.headers)
  }
}

function createResponse (status, body = undefined, headers = new Headers()) {
  headers = new Headers(headers)
  headers.set('Vary', 'Accept-Encoding')

  if (body === undefined) {
    body = `${status} - ${statusText[status]}`
    headers.set('Content-Type', mimeTypes['txt'])
  } else if (body === null) {
    headers.delete('Content-Encoding')
    headers.delete('Content-Type')
  }

  if ([ 200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501 ].includes(status)) {
    headers.set('Cache-Control', 'max-age=0, must-revalidate')
  }

  if (!headers.has('Content-Type') || headers.get('Content-Type').split(';')[0] == 'text/html') {
    Object.entries(securityHeaders).forEach(pair => headers.set(pair[0], pair[1]))
  }

  const response = new Response(body, { status, statusText: statusText[status], headers })
  return response
}

async function cachedFileLookup (pathname) {
  let staticFile = staticFiles[pathname]
  if (staticFile === undefined) {
    const body = lookup(pathname)
    if (body !== undefined) {
      const hashBuffer = await crypto.subtle.digest('SHA-1', body)
      const uint8Array = new Uint8Array(hashBuffer)
      const hashArray = Array.from(uint8Array)
      const etag = `"${btoa(hashArray.map(b => String.fromCharCode(b)).join(''))}"`
      const headers = new Headers({ 'Content-Encoding': 'gzip', 'ETag': etag })
      const extension = pathname.substr(pathname.lastIndexOf('.') + 1)
      if (mimeTypes[extension] !== undefined) {
        headers.set('Content-Type', mimeTypes[extension])
      }

      staticFile = staticFiles[pathname] = { body, etag, headers }
    }
  }

  return staticFile
}

let notFound

const staticFiles = new Map()

const { lookup } = wasm_bindgen // eslint-disable-line no-undef, camelcase

const statusText = {
  200: 'OK',
  301: 'Moved Permanently',
  304: 'Not Modified',
  404: 'Not Found',
  500: 'Internal Server Error',
  501: 'Not Implemented'
}

const mimeTypes = {
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
  ico: 'image/vnd.microsoft.icon',
  js: 'text/javascript',
  json: 'application/json',
  png: 'image/png',
  txt: 'text/plain; charset=utf-8',
  webmanifest: 'application/manifest+json',
  xml: 'text/xml'
}

const securityHeaders = {
	'Content-Security-Policy': 'upgrade-insecure-requests',
	'Feature-Policy': '',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Strict-Transport-Security': 'max-age=2592000',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'deny',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Xss-Protection': '1; mode=block'
}