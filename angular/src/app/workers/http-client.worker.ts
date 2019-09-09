import { DataSource } from './datasource';

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
  [client: string]: ClientHandler[];
}

interface ClientHandler {
  url: string;
  services: string[];
  methods: {
    [k in 'GET' | 'POST' | 'PUT' | 'DELETE']: string;
  };
}

declare const schema: Schema | null;
declare const services: any | null;

const buildUrl = (baseUrl, endpoint) =>
  `${this.baseUrl}/${
    endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  }`;

export class HttpClient {
  baseUrl = '';
  clients: Clients;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.endsWith('/')
      ? baseUrl.substr(0, baseUrl.length - 1)
      : baseUrl;

    importScripts(`${this.baseUrl}/services/index.js`);
    console.log(services);
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
