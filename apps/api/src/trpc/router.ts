import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { RouteMeta } from "trpc-docs-generator";

const t = initTRPC.meta<RouteMeta>().create();

export const appRouter = t.router({
  healthcheck: t.procedure
    .meta({
      name: "Health check",
      docs: {
        description: "Checks whether the api is responding",
        tags: ["System"],
      },
    })
    .output(
      z.object({
        status: z.literal("ok"),
        message: z.string(),
        timestamp: z.string(),
      }),
    )
    .query(() => ({
      status: "ok" as const,
      message: "test",
      timestamp: new Date().toISOString(),
    })),
});

export type AppRouter = typeof appRouter;
