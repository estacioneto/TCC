import { DataSource } from './datasource';
import { isArray, reduce } from 'lodash';

const BASE_URL = 'http://localhost:3000';

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

export class HttpClient {
  baseUrl = '';
  clients: Clients;
  schema: Schema;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.endsWith('/')
      ? baseUrl.substr(0, baseUrl.length - 1)
      : baseUrl;

    importScripts(`${this.baseUrl}/services/schema.js`);
    if (self.schema) {
      this.schema = self.schema;
      delete self.schema;
      this.buildClients();
    }
  }

  private buildClients(): void {
    const { clients } = this.schema;
    this.clients = reduce(
      clients,
      (acc, _, client) => {
        importScripts(`${this.baseUrl}/services/${client}.js`);
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
    return (await fetch(buildUrl(this.baseUrl, endpoint), options)).json();
  }

  async post<T>(
    endpoint: string = '',
    data: any,
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(buildUrl(this.baseUrl, endpoint), {
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
    return (await fetch(buildUrl(this.baseUrl, endpoint), {
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
    return (await fetch(buildUrl(this.baseUrl, endpoint), {
      ...options,
      body: data,
      method: 'DELETE',
    })).json();
  }
}
