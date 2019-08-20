import * as Comlink from 'comlink';

import { SimpleWorker } from './simple.worker';

Comlink.expose(SimpleWorker);
