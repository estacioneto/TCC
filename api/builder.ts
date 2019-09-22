import fs from "fs-extra";
import path from "path";
import colors from "colors/safe";
import express from "express";
import { Context, Script, createContext, runInContext } from "vm";
import { curry, forEach, isArray, omit } from "lodash";

import { CDN_BASE_URL } from "./constants";
import { DataSource } from "./datasource";

type Schema = {
  cdnUrl?: string;
  routes: {
    [endpoint: string]: EndpointDefinition;
  };
};

type EndpointDefinition = {
  [method in HTTPMethod]?: HandlerDefinition | HandlerDefinition[];
} & {
  options?: express.RouterOptions;
};

type HandlerDefinition = {
  service: string;
  handler: string;
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

const getService = curry((ctx: Context) => async (service: string) => {
  if (!ctx[service]) {
    await buildService(service, ctx);
  }
  return ctx[service];
});

export function buildEndpoints(
  app: express.Express,
  schema: Schema,
  serviceContext?: Context
) {
  const ctx = serviceContext || createContext();
  forEach(schema.routes, (routeDefinition, route) => {
    console.log(colors.cyan(`\nEndpoint ${colors.bold(route)} will be added`));
    const router = createEndpoint(
      routeDefinition,
      route,
      handleRequest(ctx, getService(ctx))
    );
    app.use(router);
  });

  console.log();
}

function logServiceHandler(definition: HandlerDefinition[]) {
  return definition
    .reduce<string[]>(
      (acc, { service, handler }) => [...acc, `${service}#${handler}`],
      []
    )
    .join(", ");
}

function createEndpoint(
  routeDefinition: EndpointDefinition,
  route: string,
  requestHandler: (handlers: HandlerDefinition[]) => express.RequestHandler
): express.Router {
  const router = express.Router(routeDefinition.options);
  forEach(omit(routeDefinition, "options"), (handlerDefinition, method) => {
    if (handlerDefinition) {
      const definitionArr = isArray(handlerDefinition)
        ? handlerDefinition
        : [handlerDefinition];
      console.log(
        colors.blue(
          `Adding handler to: ${colors.bold(
            `[${method}]: /api${route} - ${logServiceHandler(definitionArr)}`
          )}`
        )
      );
      router[
        method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete"
      ](`/api${route}`, requestHandler(definitionArr));
    }
  });
  return router;
}

const handleRequest = curry(
  async (
    ctx: Context,
    getService: (service: string) => Promise<any>,
    handlerDefinition: HandlerDefinition[],
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    let response: any = null;

    // To run consecutivelly, keep it simple and iterate in a for loop
    for (const index in handlerDefinition) {
      const { service: serviceName, handler } = handlerDefinition[index];
      const service = await getService(serviceName);
      const db = new DataSource();
      try {
        response = await service[handler](db, req);
      } catch (e) {
        // Will break and won't run the next handler
        return res
          .status(e.status || 500)
          .send(e.status ? omit(e, "status") : e);
      }
    }

    return res
      .status(response.status || (req.method === "POST" ? 201 : 200))
      .json(response.json || response);
  }
);
