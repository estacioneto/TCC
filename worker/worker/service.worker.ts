declare var self: ServiceWorkerGlobalScope
export {}

import pathToRegexp from 'path-to-regexp'
import workboxNamespace from 'workbox-sw'
import localForage from 'localforage'

import isArray from 'lodash/isArray'
import omit from 'lodash/omit'

import { Queue, QueueEntry } from 'workbox-types'

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
const { strategies, backgroundSync } = workbox

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

type Params = {
  [k: string]: any
}

const API_BASE_URL = 'http://localhost:8080'

let services: {
  [key: string]: {
    [fn: string]: RouteHandler
  }
} = {}
let schema: Schema

type WorkerStatus = 'UP_TO_DATE' | 'OUTDATED'

let status: WorkerStatus = 'UP_TO_DATE'

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
  // In case the API_BASE_URL has the port definition in it
  if (API_BASE_URL.includes(':')) {
    keys.shift()
  }
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

const fetchStrategy = new strategies.NetworkFirst()

async function fetchService(service: string) {
  // importScripts doesn't work 🤷
  const script = new Function(
    await fetchStrategy
      .makeRequest({ request: `${API_BASE_URL}${schema.cdnUrl}/${service}.js` })
      .then(res => res.text())
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

          for (const { service } of definitionArr) {
            if (!services[service]) {
              logger.debug(
                `${service} service was not fetched yet. Fetching...`
              )
              services[service] = await fetchService(service)
              logger.debug(`${service} service added!`)
            }

            matcher[method as HTTPMethod].push([
              ...endpointMatch,
              definitionArr.map(({ service, handler }) =>
                services[service][handler].bind(services[service])
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

const db = new DataSource()

async function updateCollections() {
  try {
    const collections = await fetchStrategy
      .makeRequest({
        request: `${API_BASE_URL}/api/collections`,
      })
      .then(res => res.json())

    logger.groupCollapsed('Putting collections into the indexedDB')
    for (const collectionName in collections) {
      logger.log(`- ${collectionName}`, collections[collectionName])
      await localForage.setItem(collectionName, collections[collectionName])
    }
    logger.groupEnd()
  } catch {
    logger.error('Failed to update collections... What should I do?')
  }
}

async function onActivation(_: ExtendableEvent) {
  schema = await fetchStrategy
    .makeRequest({ request: `${API_BASE_URL}/api/schema` })
    .then(res => res.json())
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

  await updateCollections()

  logger.log('Service worker activated!')
}

self.addEventListener('activate', event => {
  event.waitUntil(onActivation(event))
})

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
})


async function handleErrorStatus(_: Queue, __: QueueEntry, ___: Response) {
  logger.error("I don't know what to do yet :/")
}

async function onSync({ queue }: { queue: Queue }) {
  logger.debug('Replaying requests...')
  let queueEntry = null
  do {
    queueEntry = await queue.shiftRequest()
    if (queueEntry) {
      logger.groupCollapsed(`Replaying request to ${queueEntry.request.url}`)
      try {
        const syncReq = queueEntry.request.clone()
        syncReq.headers.append(
          'Sync-Timestamp',
          queueEntry.timestamp.toString()
        )
        const response = await fetch(syncReq)
        logger.debug('Response:', response)
        if (response.ok) {
          logger.log('Response successful!')
        } else {
          logger.debug('Response has error status. Handling it...')
          await handleErrorStatus(queue, queueEntry, response)
          break
        }
      } catch (err) {
        logger.error(
          'Failed to fetch! Adding request to the begining of the queue',
          err
        )
        // Something went wrong and we need to replay it again later
        queue.unshiftRequest(queueEntry)
        break
      } finally {
        logger.groupEnd()
      }
    }
  } while (queueEntry)
  if (!queueEntry) {
    logger.log(
      'Queue empty! All requests were fulfilled. Updating collections...'
    )
    await updateCollections()
    status = 'UP_TO_DATE'
    logger.debug('Collections updated!')
    logger.log('Sync finished successfully! Should message the Main Thread?')
  }
}

const queue = new backgroundSync.Queue('background-queue', {
  onSync,
  maxRetentionTime: Infinity,
})

function getRouteMatcher(request: Request): RouteMatcher | null {
  const { method, url } = request

  return (
    matcher[method as HTTPMethod].find(
      ([regexp]) => regexp.exec(url) !== null
    ) || null
  )
}

async function handleRequest(event: FetchEvent, matcher: RouteMatcher) {
  try {
    if (status === 'UP_TO_DATE') {
      const response = await fetch(event.request)
      if (event.request.method !== 'GET' && response.ok) {
        // No need to wait that to return
        logger.log('Response successful! UpCollections updated!')
        updateCollections().then(() => {
          logger.debug('Collections updated!')
        })
      }
      return response
    } else {
      throw Error('Outdated. Must handle offline.')
    }
  } catch (err) {
    // Error while fetching. Not something about error status. These doesn't throw
    logger.error('Error while trying to fetch -', err)

    const [regexp, keys, handlers] = matcher
    const { request } = event
    const result: RegExpExecArray = regexp.exec(request.url)!
    logger.groupCollapsed('We have the matcher and the event')
    logger.log('Matcher:', matcher)
    logger.log('Event:', event)
    logger.log('After apply regexp:', result)
    logger.groupEnd()

    const [_url, _port, ...paramsArray] = result
    const params: Params = keys.reduce(
      (acc, key, index) => ({
        ...acc,
        [key.name]: paramsArray[index],
      }),
      {}
    )

    const headers = new Headers()
    headers.append('From-Worker', 'true')
    let response = null
    for (const index in handlers) {
      try {
        response = await handlers[index](db, { params })
      } catch (e) {
        logger.groupCollapsed("The handler's response wasn't a success one...")
        logger.error(e)
        logger.groupEnd()
        return new Response(JSON.stringify(e.status ? omit(e, 'status') : e), {
          status: e.status || 500,
          headers,
        })
      }
    }

    if (request.method !== 'GET') {
      status = 'OUTDATED'
      await queue.pushRequest({
        request,
        timestamp: Date.now(),
        metadata: null,
      })
    }
    const res = new Response(JSON.stringify(response.json || response), {
      status: response.status || request.method === 'POST' ? 201 : 200,
      headers,
    })
    logger.groupCollapsed('Success response was processed in worker!')
    logger.log(res)
    logger.groupEnd()

    return res
  }
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const handler = getRouteMatcher(event.request)
  if (!handler) return

  const [, , , route] = handler
  logger.log(`Found a match in route ${route}!`)
  logger.debug('Time to handle it...')

  event.respondWith(handleRequest(event, handler))

  // event.waitUntil(
  // queue.unshiftRequest({
  // request: event.request,
  // timestamp: Date.now(),
  // metadata: null,
  // })
  // )
})
