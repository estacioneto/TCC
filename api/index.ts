import { createContext, Script } from 'vm'
import path from 'path'
import fs from 'fs-extra'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import colors from 'colors/safe'

import schema from './schema/schema.json'

import { buildEndpoints, buildClients } from './builder'

const app = express()
const port = process.env.PORT || 8080

app.use(cors())
app.use(morgan('combined'))
app.use(
  '/cdn/services',
  express.static(path.join(__dirname, '/dist/cdn/services'))
)

app.get('/api/schema', (req, res) => res.send(schema))
app.get('/api/collections', async (req, res) =>
  // Could have more logic involved
  res.send(await fs.readJSON(path.join(__dirname, '/datasource/db.json')))
)
;(async () => {
  app.listen(port, async () => {
    // API running in https://localhost:8080
    // And this is the schema:
    try {
      await buildEndpoints(app, schema)

      console.log(
        colors.green(
          `API running in ${colors.bold(`https://localhost:${port}`)}`
        )
      )
      console.log(colors.yellow('And this is the schema:'))
      console.log(JSON.stringify(schema, null, 2))
    } catch (e) {
      console.error(
        colors.red(
          `${colors.bold(
            'Unable to build API endpoints.'
          )} This was the error:\n${e}`
        )
      )
    }
  })
})()
