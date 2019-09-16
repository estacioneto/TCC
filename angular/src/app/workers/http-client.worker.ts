import { DataSource } from './datasource';
import { isArray, reduce } from 'lodash';

const BASE_URL = 'http://localhost:8080';
const CDN_BASE_URL = `${BASE_URL}/cdn`;
const API_BASE_URL = `${BASE_URL}/api`;

/**
 * Schema example
 *
 * @example {
 *   clients: [{
 *     counter: [{
 *       url: '/counter/:id',
 *       methods: {
 *         'GET': 'getCounter',
 *         'POST': 'addToCounter',
 *         'DELETE': 'resetCounter'
 *       },
 *       services: ['getCounter.js', 'addToCounter.js' ... ]
 *     }]
 *   }],
 *   getHandlers()
 * }
 *
 * This way, we can import from '/services/counter' these functions
 * and use them accordingly to the user's need.
 */

interface Schema {
  clients: ClientsDefinition;
  getHandlers: () => Clients;
}

interface Clients {
  [client: string]: {
    // FIXME can we add some type checking maybe?
    [handler: string]: (db: DataSource, ...args: any[]) => any;
  };
}

interface ClientsDefinition {
  [client: string]: ClientHandler | ClientHandler[];
}

interface ClientHandler {
  url: string;
  methods: {
    [k in 'GET' | 'POST' | 'PUT' | 'DELETE']: string;
  };
}

// FIXME: NOT ANY
declare const self: any;

const buildUrl = (baseUrl, endpoint) =>
  `${this.baseUrl}/${
    endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  }`;

const buildBaseUrl = url =>
  url.endsWith('/') ? url.substr(0, url.length - 1) : url;

export class HttpClient {
  cdnBaseUrl = '';
  apiBaseUrl = '';
  clients: Clients;
  schema: Schema;

  constructor(
    cdnBaseUrl: string = CDN_BASE_URL,
    apiBaseUrl: string = API_BASE_URL
  ) {
    this.cdnBaseUrl = buildBaseUrl(cdnBaseUrl);
    this.apiBaseUrl = buildBaseUrl(apiBaseUrl);

    this.fetchSchema().then(() => {
      this.buildClients();
    });
  }

  private async fetchSchema(): Promise<void> {
    this.schema = await (await fetch(`${this.apiBaseUrl}/schema`)).json();
  }

  private buildClients(): void {
    const { clients } = this.schema;
    this.clients = reduce(
      clients,
      (acc, _, client) => {
        importScripts(`${this.cdnBaseUrl}/services/${client}.js`);
        if (self[client]) {
          const handler = self[client];
          delete self[client];
          return { ...acc, [client]: handler };
        }
        return acc;
      },
      {} as Clients
    );
    console.log(this.clients, self);
    console.log(this.clients.counter.incrementCounter(null));
  }

  async get<T>(
    endpoint: string = '',
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(buildUrl(this.apiBaseUrl, endpoint), options)).json();
  }

  async post<T>(
    endpoint: string = '',
    data: any,
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(buildUrl(this.apiBaseUrl, endpoint), {
      ...options,
      body: data,
      method: 'POST',
    })).json();
  }

  async put<T>(
    endpoint: string = '',
    data: any,
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(buildUrl(this.apiBaseUrl, endpoint), {
      ...options,
      body: data,
      method: 'PUT',
    })).json();
  }

  async delete<T>(
    endpoint: string = '',
    data: any,
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(buildUrl(this.apiBaseUrl, endpoint), {
      ...options,
      body: data,
      method: 'DELETE',
    })).json();
  }
}
