import fs from 'fs-extra'
import path from 'path'
import colors from 'colors/safe'
import { Har, Header, Entry } from 'har-format'
import { filter } from 'lodash'
import { map, tap } from 'ramda'

function isFromWorker(headers: Header[]) {
  return headers.some(header => header.name.toLowerCase() === 'from-worker')
}

function isFromAPI(headers: Header[], serverIPAddress?: string) {
  return (
    headers.some(header => header.name.toLowerCase() === 'from-api') &&
    serverIPAddress === ''
  )
}

function isSyncRequest(headers: Header[]) {
  return headers.some(header => header.name.toLowerCase() === 'sync-timestamp')
}

// Read the directory file
fs.readdir(path.join(__dirname, 'data'))
  // Map to Har files with the `fileName` property.
  .then((files: string[]) =>
    Promise.all(
      files.map(fileName =>
        fs
          .readJSON(path.join(__dirname, `data/${fileName}`))
          .then((har: Har) => ({ fileName, ...har }))
      )
    )
  )
  // Just log
  // .then(
  // tap(
  // map(({ fileName }) =>
  // console.log(
  // colors.cyan(`${colors.bold(fileName)} - Analysing entries...`)
  // )
  // )
  // )
  // )
  // Map to an object that filters the entries and split into different properties
  .then(
    map(({ fileName, log: { entries, ...restLog } }) => ({
      fileName,
      log: {
        ...restLog,
      },
      workerEntries: filter(entries, entry =>
        isFromWorker(entry.response.headers)
      ),
      apiOnlyEntries: filter(
        entries,
        entry =>
          isFromAPI(entry.response.headers, entry.serverIPAddress) &&
          !isSyncRequest(entry.request.headers) &&
          !isFromWorker(entry.request.headers)
      ),
      syncEntries: filter(entries, entry =>
        isSyncRequest(entry.request.headers)
      ),
    }))
  )
  // .then(
  // map(
  // tap(log =>
  // console.log(log.fileName, {
  // api: log.apiOnlyEntries.map(({ time }) => time),
  // worker: log.workerEntries.map(({ time }) => time),
  // sync: log.syncEntries.map(({ time }) => time),
  // })
  // )
  // )
  // )
  .then(
    map(({ apiOnlyEntries, workerEntries, syncEntries, ...restLog }) => ({
      api: apiOnlyEntries.map(({ time }) => Math.round(time)).join(', '),
      worker: workerEntries.map(({ time }) => Math.round(time)).join(', '),
      sync: syncEntries.map(({ time }) => Math.round(time)).join(', '),
      ...restLog,
    }))
  )
  .then(
    map(log =>
      [
        `\n${log.fileName}`,
        `API, ${log.api}`,
        `Worker, ${log.worker}`,
        `Sync, ${log.sync}`,
      ].join('\n')
    )
  )
  .then(logs => logs.join('\n'))
  .then(log => fs.writeFile(path.join(__dirname, 'output.csv'), log))
  .then(() => console.log(colors.green('Done! ✨')))
