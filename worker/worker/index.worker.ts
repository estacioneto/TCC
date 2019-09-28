declare var self: ServiceWorkerGlobalScope;
export {};

import pathToRegexp from "path-to-regexp";

import workboxNamespace from "workbox-sw";
import reduce from "lodash/reduce";

import { DataSource } from "../datasource";

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

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);

declare const workbox: typeof workboxNamespace | null;
if (!workbox) {
  throw `Boo! Workbox didn't load 😬`;
}

workbox.setConfig({ debug: true });

const { routing, strategies, backgroundSync } = workbox;

const API_BASE_URL = "http://localhost:8080";
const db = new DataSource();

let regexpHandlers: [RegExp, pathToRegexp.Key[]];

function createEndpoint(routeDefinition: EndpointDefinition, route: string) {
  const keys: pathToRegexp.Key[] = [];
  const regexp = pathToRegexp(`${API_BASE_URL}/api${route}`, keys);
  return [regexp, keys];
}

let schema: Schema;
(async () => {
  schema = await fetch(`${API_BASE_URL}/api/schema`).then(res => res.json());
})();

const queue = new backgroundSync.Queue("background-queue", {
  onSync: _queue => {
    const queue: typeof _queue = (_queue as any).queue;
    console.log("wooot", queue);
  }
});

self.addEventListener("fetch", async (event: FetchEvent) => {
  // Learning how to use requests
  event.waitUntil(
    queue.unshiftRequest({
      request: event.request,
      timestamp: Date.now(),
      metadata: null
    })
  );
  event.respondWith(fetch(event.request));
});
