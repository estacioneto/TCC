import fs from "fs-extra";
import path from "path";
import colors from "colors/safe";
import express from "express";
import { Context, Script, createContext, runInContext } from "vm";
import { curry, forEach, isArray } from "lodash";

import { CDN_BASE_URL } from "./constants";
import { DataSource } from "./datasource";

type Schema = {
  clients: {
    [client: string]: ClientDefinition | ClientDefinition[];
  };
};

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ClientDefinition = {
  url: string;
  path?: string;
  options?: express.RouterOptions;
  methods: {
    [k in keyof HTTPMethod]: string;
  };
};

function getServiceCode(service: string) {
  // TODO: What about prod?
  return fs.readFile(
    path.join(__dirname, "/dist/cdn/services", `${service}.js`),
    "utf-8"
  );
}

async function buildService(service: string, context: Context) {
  const code = await getServiceCode(service);
  const script = new Script(code);
  script.runInContext(context);
}

export async function buildClients(schema: any, context?: Context) {
  const { clients } = schema;
  const ctx = context || createContext();

  const clientsPromises = Object.keys(clients).map(service =>
    buildService(service, ctx)
  );
  await Promise.all(clientsPromises);

  return ctx;
}

const handleRequest = curry(
  async (
    ctx: Context,
    serviceName: string,
    getService: () => Promise<any>,
    handler: string,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const service = await getService();
    const db = new DataSource();
    try {
      const response = await service[handler](db, req);
      // TODO: Better status handling
      return res.status(req.method === "GET" ? 200 : 201).json(response);
    } catch (e) {
      // TODO: Better error handling (if no handler found, another status should be sent)
      return res.status(e.status || 400).send(e);
    }
  }
);

const getService = curry(
  (ctx: Context, service: string, definition: ClientDefinition) => async () => {
    if (!ctx[service]) {
      await buildService(service, ctx);
    }
    return ctx[service];
  }
);

export function buildEndpoints(
  app: express.Express,
  schema: Schema,
  serviceContext?: Context
) {
  const ctx = serviceContext || createContext();
  forEach(schema.clients, (definition, service) => {
    const definitionArr = isArray(definition) ? definition : [definition];
    console.log(
      colors.cyan(
        `\nEndpoint(s) will be added to be handled by ${colors.bold(
          service
        )} service`
      )
    );
    definitionArr.forEach(def => {
      const router = createEndpoint(
        def,
        handleRequest(ctx, service, getService(ctx, service, def))
      );
      app.use(router);
    });
  });

  console.log();
}

function createEndpoint(
  client: ClientDefinition,
  requestHandler: (handler: string) => express.RequestHandler
): express.Router {
  const router = express.Router(client.options);
  forEach(client.methods, (handler, method) => {
    console.log(
      colors.blue(
        `Adding handler to: ${colors.bold(
          `[${method}]: /api${client.url} - ${handler}`
        )}`
      )
    );
    router[method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete"](
      `/api${client.url}`,
      requestHandler(handler)
    );
  });
  return router;
}
