declare var self: ServiceWorkerGlobalScope
export {}

import pathToRegexp from 'path-to-regexp'
import workboxNamespace from 'workbox-sw'

import forEach from 'lodash/forEach'
import isArray from 'lodash/isArray'
import omit from 'lodash/omit'

import { DataSource } from '../datasource'
import { logger } from './logger'

// --- Workbox configuration

importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
)
declare const workbox: typeof workboxNamespace | null
if (!workbox) {
  throw `Boo! Workbox didn't load 😬`
}
workbox.setConfig({ debug: true })
const { routing, strategies, backgroundSync } = workbox

// --- Workbox configuration

type Schema = {
  cdnUrl?: string
  routes: {
    [endpoint: string]: EndpointDefinition
  }
}

type EndpointDefinition = {
  [method in HTTPMethod]?: HandlerDefinition | HandlerDefinition[]
} & {
  options?: any
}

type HandlerDefinition = {
  service: string
  handler: string
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// FIXME: Correctly type it
type RouteHandler = Function

type Route = string

type RouteMatcher = [RegExp, pathToRegexp.Key[], RouteHandler[], Route]

type RoutesMatcher = {
  [method in HTTPMethod]: RouteMatcher[]
}

const API_BASE_URL = 'http://localhost:8080'

let services: {
  [key: string]: {
    [fn: string]: RouteHandler
  }
} = {}
let schema: Schema

const matcher: RoutesMatcher = {
  GET: [],
  POST: [],
  PUT: [],
  PATCH: [],
  DELETE: [],
}

function createEndpoint(route: string): [RegExp, pathToRegexp.Key[]] {
  const keys: pathToRegexp.Key[] = []
  const regexp = pathToRegexp(`${API_BASE_URL}/api${route}`, keys)
  return [regexp, keys]
}

function logServiceHandler(definition: HandlerDefinition[]) {
  return definition
    .reduce<string[]>(
      (acc, { service, handler }) => [...acc, `${service}#${handler}`],
      []
    )
    .join(', ')
}

async function fetchService(service: string) {
  const script = new Function(
    await fetch(`${API_BASE_URL}${schema.cdnUrl}/${service}.js`).then(res =>
      res.text()
    )
  )

  script()
  const s = (self as any)[service]
  delete (self as any)[service]
  return s
}

async function handleSchemaRoutes(schema: Schema) {
  const { routes } = schema

  for (const route in routes) {
    const routeDefinition = routes[route]
    // Create endpoint for a route
    logger.groupCollapsed(`Endpoint ${route} will be added`)
    try {
      const endpointMatch = createEndpoint(route)
      logger.debug(endpointMatch)

      for (const method in omit(routeDefinition, 'options')) {
        const handlerDefinition = routeDefinition[method as HTTPMethod]

        if (handlerDefinition) {
          const definitionArr = isArray(handlerDefinition)
            ? handlerDefinition
            : [handlerDefinition]
          logger.log(
            `Adding handlers to [${method}]: /api${route} - ${logServiceHandler(
              definitionArr
            )}`
          )

          for (const { service, handler } of definitionArr) {
            if (!services[service]) {
              logger.debug(
                `${service} service was not fetched yet. Fetching...`
              )
              services[service] = await fetchService(service)
              logger.debug(`${service} service added!`)
            }

            matcher[method as HTTPMethod].push([
              ...endpointMatch,
              definitionArr.map(
                ({ service, handler }) => services[service][handler]
              ),
              route,
            ] as RouteMatcher)
          }
          logger.log(`Handlers added!`)
        }
      }
      logger.groupEnd()
    } catch (err) {
      logger.groupEnd()
      throw err
    }
  }
}

async function onActivation() {
  schema = await fetch(`${API_BASE_URL}/api/schema`).then(res => res.json())
  logger.groupCollapsed(
    'Service worker will be activated with the following schema:'
  )
  logger.log(JSON.stringify(schema, null, 2))
  logger.groupEnd()

  try {
    await handleSchemaRoutes(schema)
  } catch (err) {
    logger.error('Failed to parse schema and fetch services...')
    logger.error(err)
  }

  logger.groupCollapsed('Built routes matcher!')
  logger.log(matcher)
  logger.groupEnd()

  logger.log('Service worker activated!')
}

self.addEventListener('activate', event => {
  event.waitUntil(onActivation())
})

const queue = new backgroundSync.Queue('background-queue', {
  onSync: _queue => {
    const queue: typeof _queue = (_queue as any).queue
    logger.debug('wooot', queue)
  },
  maxRetentionTime: Infinity,
})

const db = new DataSource()

function getRouteMatcher(request: Request): RouteMatcher | null {
  const { method, url } = request

  return (
    matcher[method as HTTPMethod].find(
      ([regexp, keys]) => regexp.exec(url) !== null
    ) || null
  )
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const handler = getRouteMatcher(event.request)
  if (!handler) return

  const [regexp, keys, handlers, route] = handler
  logger.log(`Found a match in route ${route}!`)
  logger.debug(
    "Time to handle it... But not now because I haven't implemented it yet 😅"
  )
  // event.waitUntil(
  // queue.unshiftRequest({
  // request: event.request,
  // timestamp: Date.now(),
  // metadata: null,
  // })
  // )
})
