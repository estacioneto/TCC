import { expose } from 'comlink';
import { HttpClient } from './http-client.worker';

if (!self.fetch) {
  console.warn('No fetch detected... The worker will not work :/');
}

expose(HttpClient);
