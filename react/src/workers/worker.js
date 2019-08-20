import * as Comlink from 'comlink'
import worker from './simple.worker'

Comlink.expose(worker)
