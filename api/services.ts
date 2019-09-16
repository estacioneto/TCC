import colors from "colors/safe";
import express from "express";
import { Context, Script, createContext, runInContext } from "vm";
import fetch from "node-fetch";
import { curry, forEach, isArray } from "lodash";

import { CDN_BASE_URL } from "./constants";

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

export async function buildService(service: string, context: Context) {
  const code = await (await fetch(
    `${CDN_BASE_URL}/services/${service}.js`
  )).text();
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

  return context;
}

const handleRequest = curry(
  (
    context: Context,
    service: string,
    fetchService: () => Promise<any>,
    handler: string,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log("Requested", req);
    console.log("Data", service, handler);
    return res.end("yey");
  }
);

const handleFetchService = curry(
  (ctx: Context, service: string, definition: ClientDefinition) => () => {
    console.log("handleFetchService!");
  }
);

export function buildEndpoints(
  app: express.Express,
  schema: Schema,
  serviceContext: Context
) {
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
        handleRequest(
          serviceContext,
          service,
          handleFetchService(serviceContext, service, def)
        )
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
          `[${method}]: ${client.url} - ${handler}`
        )}`
      )
    );
    router[method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete"](
      client.url,
      requestHandler(handler)
    );
  });
  return router;
}
