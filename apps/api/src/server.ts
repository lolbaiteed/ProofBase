import Fastify from "fastify";
import { RequestContext } from "@mikro-orm/core";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { orm } from "./utils/database.js";
import { appRouter } from "./trpc/router.js";
import cors from "@fastify/cors";
import { collectRoutes, generateDocsHtml } from "trpc-docs-generator";

const app = Fastify({
  logger: true,
});

app.addHook("onRequest", (_request, _reply_, done) => {
  RequestContext.create(orm.em, done);
});

async function main() {
  await app.register(cors, {
    origin: "http://localhost:3000",
  });
  await app.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: async () => ({
        em: orm.em,
      }),
    },
  });

  app.get("/docs", async (_request, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.code(404).send();
    }

    const routes = collectRoutes(appRouter);

    const html = generateDocsHtml(routes, {
      title: "Govmap API",
      defaultBaseURL: "http://localhost:3001/trpc",
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  app.addHook("onClose", async () => {
    await orm.close(true);
  });

  await app.listen({
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? "127.0.0.1",
  });
}

main().catch((error: unknown) => {
  app.log.error(error);
  process.exitCode = 1;
});
