import { Injectable } from '@angular/core';
import { wrap, Remote } from 'comlink';

import { environment } from '../../environments/environment';
import { HttpClient } from './http-client.worker';

const HttpClientWorker = wrap<typeof HttpClient>(
  new Worker('./comlink-http-client.worker.ts', { type: 'module' })
);

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  client: Remote<HttpClient>;

  constructor() {
    (async () => {
      this.client = await new HttpClientWorker(environment.apiUrl);
    })();
  }

  get<T>(endpoint: string, options?: Partial<RequestInit>): Promise<T> {
    return this.client.get(endpoint, options) as Promise<T>;
  }
}
