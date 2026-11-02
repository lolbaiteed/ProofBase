import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { RouteMeta } from "trpc-docs-generator";
import type { Context } from "./context.js";

const t = initTRPC.context<Context>().meta<RouteMeta>().create();

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

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
