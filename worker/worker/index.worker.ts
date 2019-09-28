import * as pathToRegexp from "path-to-regexp";

import forEach from "lodash/forEach";

import { DataSource } from "../datasource";

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);

declare const workbox: typeof import("workbox-sw") | null;
type Schema = {
  cdnUrl?: string;
  routes: {
    [endpoint: string]: EndpointDefinition;
  };
};

type EndpointDefinition = {
  [method in HTTPMethod]?: HandlerDefinition | HandlerDefinition[];
} & {
  options?: any;
};

type HandlerDefinition = {
  service: string;
  handler: string;
};

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

if (!workbox) {
  throw `Boo! Workbox didn't load 😬`;
}

const API_BASE_URL = "http://localhost:8080";
const db = new DataSource();

let schema: Schema;

const loggerPlugin = {
  cacheWillUpdate: async ({ request, response, event }) => {
    // Return `response`, a different Response object or null
    return response;
  },
  cacheDidUpdate: async ({
    cacheName,
    request,
    oldResponse,
    newResponse,
    event
  }) => {
    // No return expected
    // Note: `newResponse.bodyUsed` is `true` when this is called,
    // meaning the body has already been read. If you need access to
    // the body of the fresh response, use a technique like:
    // const freshResponse = await caches.match(request, {cacheName});
  },
  cacheKeyWillBeUsed: async ({ request, mode }) => {
    // request is the Request object that would otherwise be used as the cache key.
    // mode is either 'read' or 'write'.
    // Return either a string, or a Request whose url property will be used as the cache key.
    // Returning the original request will make this a no-op.
  },
  cachedResponseWillBeUsed: async ({
    cacheName,
    request,
    matchOptions,
    cachedResponse,
    event
  }) => {
    // Return `cachedResponse`, a different Response object or null
    return cachedResponse;
  },
  requestWillFetch: async ({ request }) => {
    // Return `request` or a different Request
    console.log("willFetch", request);
    return request;
  },
  fetchDidFail: async ({ originalRequest, request, error, event }) => {
    // No return expected.
    // NOTE: `originalRequest` is the browser's request, `request` is the
    // request after being passed through plugins with
    // `requestWillFetch` callbacks, and `error` is the exception that caused
    // the underlying `fetch()` to fail.
    console.log("fetchDidFail", { originalRequest, request, error, event });
  },
  fetchDidSucceed: async ({ request, response }) => {
    // Return `response` to use the network response as-is,
    // or alternatively create and return a new Response object.
    console.log("fetchDidSucceed", { request, response });
    return response;
  }
};

function createEndpoint(routeDefinition: EndpointDefinition, route: string) {
  workbox.routing.registerRoute(
    `${API_BASE_URL}/api${route}`,
    new workbox.strategies.NetworkFirst({
      plugins: [loggerPlugin]
    })
  );
}

self.addEventListener("install", async event => {
  console.log(event);
  console.log("workbox!", workbox);
  schema = await fetch(`${API_BASE_URL}/api/schema`).then(res => res.json());
  forEach(schema.routes, (routeDefinition, route) => {
    console.log(`\nEndpoint ${route} will be added`);
    createEndpoint(routeDefinition, route);
    // app.use(router);
  });
});
